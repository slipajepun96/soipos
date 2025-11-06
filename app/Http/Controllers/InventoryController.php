<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\Supplier;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index()
    {
        return inertia('Inventory&Products/InventoryIndex');
    }
    
    public function stockInIndex()
    {
        $product_categories = ProductCategory::all();
        $product = Product::where('is_active', '1')->get();
        $supplier = Supplier::where('is_active', '1')->get();
        return Inertia::render('Inventory&Products/Inventory/StockIn/StockInIndex', [
            'product_categories' => $product_categories,
            'products' => $product,
            'suppliers' => $supplier,
        ]);
    }

    public function addGRN()
    {
        $product_categories = ProductCategory::all();
        $product = Product::where('is_active', '1')->get();
        $supplier = Supplier::where('is_active', '1')->get();
        return Inertia::render('Inventory&Products/Inventory/StockIn/AddGRN', [
            'product_categories' => $product_categories,
            'products' => $product,
            'suppliers' => $supplier,
        ]);
    }
}
