<?php

namespace App\Http\Controllers;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Supplier;
// use App\Models\Entity;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();
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
                'product_category_id' => 'required|string|max:255',
                'product_name' => 'required|string|max:255',
                'product_unit' => 'required|string|max:50',
                'product_sku_code' => 'nullable|string|max:100',
                'product_img_address' => 'nullable|string|max:255',
                'product_code' => 'nullable|string|max:100',
                'product_description' => 'nullable|string|max:1000',
                'product_price' => 'required|numeric',
                'product_num_of_measure' => 'required|numeric',
                'product_supplier_id' => 'required|string|max:255',
                'product_low_stock_limit' => 'required|numeric',
            ]);

            $product = new Product($validatedData);
            $product->save();
            return Redirect::route('product.index')->with('success', 'Product added successfully.');
        }
        catch (\Exception $e) {
            // Handle any unexpected errors
            return redirect()->back()->withErrors(['error' => 'An error occurred while saving this product. Please try again.']);
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
            DB::beginTransaction();
            
            Product::findOrFail($request->id)->delete();

            DB::commit();
            return redirect()->back()->with([
                'message' => 'Deleted Successfully',
                'type' => 'success'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Database error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()
                ->with('error', 'Failed to save transactions')
                ->withErrors(['database' => $e->getMessage()]);
        }

    }
}
