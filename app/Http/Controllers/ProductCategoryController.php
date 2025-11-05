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
        } catch (\Exception $e) {
            // Handle any unexpected errors
            return redirect()->back()->withErrors(['error' => 'An error occurred while updating this product category. Please try again.']);
        }
    }
}
