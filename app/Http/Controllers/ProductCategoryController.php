<?php

namespace App\Http\Controllers;
use App\Models\ProductCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use App\Models\Entity;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class ProductCategoryController extends Controller
{
    public function index()
    {
        $product_categories = ProductCategory::all();
        return Inertia::render('Inventory&Products/ProductCategories/ProductCategoriesIndex', [
            'product_categories' => $product_categories
        ]);
    }

    public function saveProductCategory(Request $request): RedirectResponse
    {
        try {
            $validatedData = $request->validate([
                'product_categories_name' => 'required|string|max:255',
                'product_categories_sub_level' => 'required|string|max:2',
                'product_categories_parent_uuid' => 'nullable|string|max:255',
            ]);

            $product_category = new ProductCategory($validatedData);
            $product_category->save();
            return Redirect::route('productCategories.index')->with('success', 'Product Category added successfully.');
        } catch (\Throwable $e) {
            return $this->failed($e, 'save the product category');
        }
    }

    public function updateProductCategory(Request $request): RedirectResponse
    {
        try {
            $productCategory = ProductCategory::findOrFail($request->id);

            $validatedData = $request->validate([
                'product_categories_name' => 'required|string|max:255',
                'product_categories_sub_level' => 'required|string|max:2',
                'product_categories_parent_uuid' => 'nullable|string|max:255',
            ]);

            if ($validatedData['product_categories_sub_level'] === '1') {
                $validatedData['product_categories_parent_uuid'] = null;
            }

            if (in_array($validatedData['product_categories_sub_level'], ['2', '3']) && empty($validatedData['product_categories_parent_uuid'])) {
                return redirect()->back()->withErrors([
                    'product_categories_parent_uuid' => 'Parent category is required for sub-level categories.',
                ]);
            }

            if (!empty($validatedData['product_categories_parent_uuid']) && $validatedData['product_categories_parent_uuid'] === $productCategory->id) {
                return redirect()->back()->withErrors([
                    'product_categories_parent_uuid' => 'A category cannot be its own parent.',
                ]);
            }

            $productCategory->update($validatedData);

            return redirect()->back()->with([
                'message' => 'Product Category updated successfully',
                'type' => 'success',
            ]);
        } catch (\Throwable $e) {
            return $this->failed($e, 'update the product category');
        }
    }

    public function deleteProductCategory(Request $request): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request) {
                ProductCategory::where('product_categories_parent_uuid', $request->id)
                    ->update(['product_categories_parent_uuid' => null]);

                ProductCategory::findOrFail($request->id)->delete();
            });

            return redirect()->back()->with([
                'message' => 'Deleted Successfully',
                'type' => 'success',
            ]);
        } catch (\Throwable $e) {
            return $this->failed($e, 'delete the product category');
        }
    }
}
