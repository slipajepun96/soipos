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
use App\Models\StockDoc;
use App\Models\Stock;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function supplier($supplier_id)
    {
        $supplier = Supplier::find($supplier_id);
        return response()->json($supplier);
    }

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

    public function addOpeningStock()
    {
        $product_categories = ProductCategory::all();
        $product = Product::where('is_active', '1')->get();
        $supplier = Supplier::where('is_active', '1')->get();
        return Inertia::render('Inventory&Products/Inventory/StockIn/AddOpeningStock', [
            'product_categories' => $product_categories,
            'products' => $product,
            'suppliers' => $supplier,
        ]);
    }

    public function saveOpeningStock(Request $request): RedirectResponse
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validate([
                'supplier_id' => 'required|string',
                'opening_stock_date' => 'required|string',
                'items' => 'required|array',
                'items.*.product_id' => 'required|string',
                'items.*.quantity' => 'required|numeric',
                'items.*.unit_cost' => 'required|numeric',
                'items.*.total_cost' => 'required|numeric',
                'items.*.expiry_date' => 'nullable|string',
            ]);

            $supplier = $this->supplier($validatedData['supplier_id'])->original;
            // dd(Auth::user());

            $stock_doc = new StockDoc();
            // $stock_doc->id = StockDoc::generateStockDocNum('Opening Stock');
            $stock_doc->stock_doc_type = StockDoc::generateCustomId("Opening Stock", $validatedData['opening_stock_date']);
            $stock_doc->stock_doc_supplier_id = $supplier->id;
            $stock_doc->stock_doc_supplier_name = $supplier->supplier_name;
            $stock_doc->stock_doc_supplier_address = $supplier->supplier_address;
            $stock_doc->stock_doc_supplier_phone_num = $supplier->supplier_phone_num;
            $stock_doc->stock_doc_supplier_email = $supplier->supplier_email;
            $stock_doc->stock_doc_date = $validatedData['opening_stock_date'];
            $stock_doc->stock_doc_year = date('Y', strtotime($validatedData['opening_stock_date']));
            $stock_doc->stock_doc_month = date('m', strtotime($validatedData['opening_stock_date']));
            $stock_doc->stock_doc_total_cost = array_sum(array_column($validatedData['items'], 'total_cost'));
            $stock_doc->stock_doc_added_by = Auth::user()->id;
            $stock_doc->save();



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
