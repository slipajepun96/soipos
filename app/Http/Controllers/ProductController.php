<?php

namespace App\Http\Controllers;

use App\Support\StoreRule;use App\Models\Product;
use App\Models\ProductBundleItem;
use App\Models\ProductCategory;
use Illuminate\Validation\ValidationException;
use App\Models\Supplier;
// use App\Models\Entity;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /** Product photo: shown on the POS and the public pre-order form. */
    private const IMAGE_RULES = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'];

    public function index()
    {
        $products = Product::with('bundleItems:id,bundle_product_id,component_product_id,quantity')->get();
        $product_categories = ProductCategory::all();
        $suppliers = Supplier::where('is_active', '1')->get();
        return Inertia::render('Inventory&Products/Product/ProductIndex', [
            'products' => $products,
            'product_categories' => $product_categories,
            'suppliers' => $suppliers,
        ]);
    }

    public function saveProduct(Request $request): RedirectResponse
    {
        // dd($request->all());
        try {

            $validatedData = $request->validate([
                'product_category_id' => ['nullable', 'string', StoreRule::exists('product_categories')],
                'product_name' => 'required|string|max:255',
                'product_unit' => 'required|string|max:50',
                'product_sku_code' => 'nullable|string|max:100',
                'product_code' => 'nullable|string|max:100',
                'product_description' => 'nullable|string|max:1000',
                'product_image' => self::IMAGE_RULES,
                'remove_image' => 'nullable|boolean',
                'product_price' => 'required|numeric',
                'product_num_of_measure' => 'required|numeric',
                'track_stock' => 'boolean',
                'is_bundle' => 'boolean',
                'product_low_stock_limit' => [$request->boolean('track_stock', true) && ! $request->boolean('is_bundle') ? 'required' : 'nullable', 'integer', 'min:0'],
            ]);
            // dd($validatedData);

            $components = $this->validateBundle($request);
            $product = new Product($this->productFields($validatedData));
            $product->product_img_address = $this->storeImage($request);
            DB::transaction(function () use ($product, $components) {
                $product->save();
                $this->syncBundle($product, $components);
            });
            return Redirect::route('product.index')->with('success', 'Product added successfully.');
        }
        catch (\Throwable $e) {
            return $this->failed($e, 'save the product');
        }

    }

    public function updateProduct(Request $request): RedirectResponse
    {
        try {
            $product = Product::findOrFail($request->id);

            $validatedData = $request->validate([
                'product_category_id' => ['nullable', 'string', StoreRule::exists('product_categories')],
                'product_name' => 'required|string|max:255',
                'product_unit' => 'required|string|max:50',
                'product_sku_code' => 'nullable|string|max:100',
                'product_code' => 'nullable|string|max:100',
                'product_description' => 'nullable|string|max:1000',
                'product_image' => self::IMAGE_RULES,
                'remove_image' => 'nullable|boolean',
                'product_price' => 'required|numeric',
                'product_num_of_measure' => 'required|numeric',
                'product_supplier_id' => 'nullable|string|max:255',
                'track_stock' => 'boolean',
                'is_bundle' => 'boolean',
                'product_low_stock_limit' => [$request->boolean('track_stock', true) && ! $request->boolean('is_bundle') ? 'required' : 'nullable', 'integer', 'min:0'],
            ]);

            $components = $this->validateBundle($request, $product);
            $fields = $this->productFields($validatedData);
            if ($request->hasFile('product_image') || $request->boolean('remove_image')) {
                $this->deleteImage($product->product_img_address);
                $fields['product_img_address'] = $this->storeImage($request);
            }
            DB::transaction(function () use ($product, $fields, $components) {
                $product->update($fields);
                $this->syncBundle($product, $components);
            });

            return redirect()->back()->with([
                'message' => 'Product updated successfully',
                'type' => 'success',
            ]);
        }
        catch (\Throwable $e) {
            return $this->failed($e, 'update the product');
        }
    }

    public function deactivateProduct(Request $request): RedirectResponse
    {
        // dd($request->all());
        $product = Product::findOrFail($request->id);
        $product->is_active = '0';
        $product->save();

        return Redirect::route('product.index')->with('success', 'Product deactivated successfully.');
    }

    public function deleteProduct(Request $request): RedirectResponse
    {
        try {
            $product = Product::findOrFail($request->id);
            $image = $product->product_img_address;
            $usedIn = ProductBundleItem::where('component_product_id', $product->id)->exists();
            if ($usedIn) {
                throw ValidationException::withMessages(['error' => "{$product->product_name} is an item in a Bakul. Remove it from the Bakul first."]);
            }
            DB::transaction(function () use ($product) {
                $product->bundleItems()->delete();
                $product->delete();
            });

            $this->deleteImage($image);
            return redirect()->back()->with([
                'message' => 'Deleted Successfully',
                'type' => 'success'
            ]);
        } catch (\Throwable $e) {
            return $this->failed($e, 'delete the product');
        }

    }

    /** Columns to save. A bundle holds no stock of its own: its components do. */
    private function productFields(array $validated): array
    {
        $fields = collect($validated)->except(['product_image', 'remove_image', 'bundle_items'])->all();
        $fields['is_bundle'] = (bool) ($validated['is_bundle'] ?? false);
        if ($fields['is_bundle']) {
            $fields['track_stock'] = false;
        }

        return $fields;
    }

    /**
     * The items inside a bundle ("Bakul"), validated: at least one, each a normal product
     * of this store (not itself a bundle), listed once.
     *
     * @return array<string,int>  component product id => units per bundle
     */
    private function validateBundle(Request $request, ?Product $product = null): array
    {
        if (! $request->boolean('is_bundle')) {
            return [];
        }

        $request->validate([
            'bundle_items' => ['required', 'array', 'min:1'],
            'bundle_items.*.product_id' => ['required', 'string', 'distinct', StoreRule::exists('products')
                ->where(fn ($q) => $q->where('is_bundle', false))],
            'bundle_items.*.quantity' => ['required', 'integer', 'min:1'],
        ], [
            'bundle_items.required' => 'Add at least one item to the Bakul.',
            'bundle_items.min' => 'Add at least one item to the Bakul.',
            'bundle_items.*.product_id.required' => 'Choose a product for each Bakul item.',
            'bundle_items.*.product_id.distinct' => 'Each product can only be listed once in the Bakul.',
            'bundle_items.*.product_id.exists' => 'A Bakul item must be a normal product (not another Bakul).',
            'bundle_items.*.quantity.min' => 'Each Bakul item needs a quantity of at least 1.',
        ]);

        if ($product) {
            if (collect($request->input('bundle_items'))->contains('product_id', $product->id)) {
                throw ValidationException::withMessages(['bundle_items' => 'A Bakul cannot contain itself.']);
            }
            if (! $product->is_bundle && ProductBundleItem::where('component_product_id', $product->id)->exists()) {
                throw ValidationException::withMessages(['bundle_items' => "{$product->product_name} is already an item in another Bakul, so it cannot be a Bakul itself."]);
            }
        }

        return collect($request->input('bundle_items'))
            ->mapWithKeys(fn ($item) => [$item['product_id'] => (int) $item['quantity']])
            ->all();
    }

    /** Replace the bundle's items (removes them when the product is no longer a bundle). */
    private function syncBundle(Product $product, array $components): void
    {
        $product->bundleItems()->delete();
        foreach ($components as $componentId => $quantity) {
            $product->bundleItems()->create(['component_product_id' => $componentId, 'quantity' => $quantity]);
        }
    }

    /** Saves the uploaded photo on the public disk and returns its URL path, or null. */
    private function storeImage(Request $request): ?string
    {
        if (! $request->hasFile('product_image')) {
            return null;
        }
        $path = $request->file('product_image')->store('products', 'public');

        return '/storage/'.$path;
    }

    /** Removes a photo this app stored (links to other sites are left alone). */
    private function deleteImage(?string $url): void
    {
        if ($url && str_starts_with($url, '/storage/products/')) {
            Storage::disk('public')->delete(substr($url, strlen('/storage/')));
        }
    }
}
