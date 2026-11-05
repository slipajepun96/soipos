<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\SalesEventController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\PreorderSessionController;
use App\Http\Controllers\PublicPreorderController;
use App\Http\Controllers\PosPreorderController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/', fn () => redirect()->route('sales.pos'))
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/agent/register', [AgentController::class, 'registerIndex'])->name('agent.register');
Route::post('/agent/register', [AgentController::class, 'saveAgentRegistration'])->name('agent.register.save');
Route::get('/agent/register/success', [AgentController::class, 'agentRegistrationSuccess'])->name('agent.register.success');

// Public pre-order form (no login)
Route::get('/p/{token}', [PublicPreorderController::class, 'show'])->name('preorder.form');
Route::post('/p/{token}', [PublicPreorderController::class, 'store'])->middleware('throttle:10,1')->name('preorder.submit');
Route::get('/p/{token}/order/{order}', [PublicPreorderController::class, 'thanks'])->name('preorder.thanks');

Route::middleware('auth')->group(function () {

    Route::get('/about', function () {return Inertia::render('About');})->name('about');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //Settings
    Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');

    //Sales / POS
    Route::get('/pos', [SaleController::class, 'pos'])->name('sales.pos');
    Route::post('/pos/checkout', [SaleController::class, 'checkout'])->name('sales.checkout');
    Route::get('/pos/preorders', [PosPreorderController::class, 'search'])->name('pos.preorders.search');
    Route::get('/pos/preorders/{order}', [PosPreorderController::class, 'show'])->name('pos.preorders.show');
    Route::post('/pos/preorders/{order}/collect', [PosPreorderController::class, 'collect'])->name('pos.preorders.collect');
    Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');

    //Pre-orders
    Route::get('/preorders', [PreorderSessionController::class, 'index'])->name('preorders.index');
    Route::get('/preorders/create', [PreorderSessionController::class, 'create'])->name('preorders.create');
    Route::post('/preorders', [PreorderSessionController::class, 'store'])->name('preorders.store');
    Route::post('/preorders/orders/{order}/cancel', [PreorderSessionController::class, 'cancelOrder'])->name('preorders.orders.cancel');
    Route::post('/preorders/orders/{order}/restore', [PreorderSessionController::class, 'restoreOrder'])->name('preorders.orders.restore');
    Route::get('/preorders/{session}', [PreorderSessionController::class, 'show'])->name('preorders.show');
    Route::get('/preorders/{session}/edit', [PreorderSessionController::class, 'edit'])->name('preorders.edit');
    Route::put('/preorders/{session}', [PreorderSessionController::class, 'update'])->name('preorders.update');
    Route::delete('/preorders/{session}', [PreorderSessionController::class, 'destroy'])->name('preorders.destroy');
    Route::post('/preorders/{session}/toggle', [PreorderSessionController::class, 'toggle'])->name('preorders.toggle');
    Route::post('/preorders/{session}/link', [PreorderSessionController::class, 'regenerateLink'])->name('preorders.link');
    Route::get('/preorders/{session}/slips', [PreorderSessionController::class, 'slips'])->name('preorders.slips');
    Route::get('/preorders/{session}/summary', [PreorderSessionController::class, 'summaryPdf'])->name('preorders.summary');
    Route::get('/sales/invoices', [InvoiceController::class, 'index'])->name('sales.invoices.index');
    Route::get('/sales/invoices/create', [InvoiceController::class, 'create'])->name('sales.invoices.create');
    Route::post('/sales/invoices', [InvoiceController::class, 'store'])->name('sales.invoices.store');
    Route::get('/sales/events', [SalesEventController::class, 'index'])->name('sales.events.index');
    Route::post('/sales/events', [SalesEventController::class, 'store'])->name('sales.events.store');
    Route::get('/sales/events/{event}', [SalesEventController::class, 'show'])->name('sales.events.show');
    Route::get('/sales/events/{event}/pdf', [SalesEventController::class, 'pdf'])->name('sales.events.pdf');
    Route::put('/sales/events/{event}', [SalesEventController::class, 'update'])->name('sales.events.update');
    Route::post('/sales/events/{event}/toggle', [SalesEventController::class, 'toggle'])->name('sales.events.toggle');
    Route::delete('/sales/events/{event}', [SalesEventController::class, 'destroy'])->name('sales.events.destroy');
    Route::get('/sales/{sale}/invoice', [InvoiceController::class, 'pdf'])->name('sales.invoice');
    Route::post('/sales/{sale}/payments', [InvoiceController::class, 'addPayment'])->name('sales.payments.store');
    Route::delete('/sales/{sale}/payments/{payment}', [InvoiceController::class, 'deletePayment'])->name('sales.payments.destroy');
    Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');
    Route::get('/sales/{sale}/receipt', [SaleController::class, 'receipt'])->name('sales.receipt');
    Route::post('/sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');

    //Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/stock-balance', [InventoryController::class, 'stockBalance'])->name('inventory.stockBalance');
    Route::get('/inventory/stock-card', [InventoryController::class, 'stockCard'])->name('inventory.stockCard');
    Route::get('/inventory/stock-card/pdf', [InventoryController::class, 'stockCardPdf'])->name('inventory.stockCard.pdf');
    Route::get('/inventory/documents/{id}', [InventoryController::class, 'getStockDocDetails'])->name('inventory.documents.details');
    Route::get('/inventory/documents/{id}/pdf', [InventoryController::class, 'downloadGRN'])->name('inventory.documents.pdf');

    //Inventory Stock In
    Route::get('/inventory/stock-in', [InventoryController::class, 'stockInIndex'])->name('inventory.stockIn.index');
    Route::get('/inventory/stock-in/add-grn', [InventoryController::class, 'addGRN'])->name('inventory.stockIn.addGRN');
    Route::post('/inventory/stock-in/add-grn/save', [InventoryController::class, 'saveGRN'])->name('inventory.stockIn.saveGRN');
    Route::get('/inventory/stock-in/opening-stock', [InventoryController::class, 'addOpeningStock'])->name('inventory.stockIn.addOpeningStock');
    Route::post('/inventory/stock-in/opening-stock/save', [InventoryController::class, 'saveOpeningStock'])->name('inventory.stockIn.saveOpeningStock');
    Route::get('/inventory/stock-in/view/{id}/details', [InventoryController::class, 'getStockDocDetails'])->name('inventory.stockIn.details');
    Route::get('/inventory/stock-in/{id}/download-grn', [InventoryController::class, 'downloadGRN'])->name('inventory.stockIn.downloadGRN');
    Route::delete('/inventory/stock-in/{id}', [InventoryController::class, 'deleteStockDoc'])->name('inventory.stockIn.delete');

    //Inventory Stock Out
    Route::get('/inventory/stock-out', [InventoryController::class, 'stockOutIndex'])->name('inventory.stockOut.index');
    Route::get('/inventory/stock-out/create', [InventoryController::class, 'addStockOut'])->name('inventory.stockOut.create');
    Route::post('/inventory/stock-out', [InventoryController::class, 'saveStockOut'])->name('inventory.stockOut.save');
    Route::get('/inventory/stock-out/{id}/details', [InventoryController::class, 'getStockOutDetails'])->name('inventory.stockOut.details');
    Route::delete('/inventory/stock-out/{id}', [InventoryController::class, 'deleteStockOut'])->name('inventory.stockOut.delete');

    //Inventory Adjustment & Dispose
    Route::get('/inventory/adjustment', [InventoryController::class, 'adjustmentIndex'])->name('inventory.adjustment.index');
    Route::get('/inventory/adjustment/stock-count', [InventoryController::class, 'addAdjustment'])->name('inventory.adjustment.create');
    Route::post('/inventory/adjustment/stock-count', [InventoryController::class, 'saveAdjustment'])->name('inventory.adjustment.save');
    Route::get('/inventory/adjustment/dispose', [InventoryController::class, 'addDisposal'])->name('inventory.adjustment.dispose');
    Route::post('/inventory/adjustment/dispose', [InventoryController::class, 'saveDisposal'])->name('inventory.adjustment.saveDisposal');
    Route::delete('/inventory/adjustment/{id}', [InventoryController::class, 'deleteAdjustment'])->name('inventory.adjustment.delete');

    //Product
    Route::get('/product/category', [ProductCategoryController::class, 'index'])->name('productCategories.index');
    Route::post('/product/category/save', [ProductCategoryController::class, 'saveProductCategory'])->name('productCategory.saveProductCategory');
    Route::post('/product/category/update', [ProductCategoryController::class, 'updateProductCategory'])->name('productCategory.updateProductCategory');
    Route::post('/product/category/delete', [ProductCategoryController::class, 'deleteProductCategory'])->name('productCategory.deleteProductCategory');
    Route::get('/product', [ProductController::class, 'index'])->name('product.index');
    Route::post('/product', [ProductController::class, 'saveProduct'])->name('product.saveProduct');
    Route::post('/product/update', [ProductController::class, 'updateProduct'])->name('product.updateProduct');
    Route::post('/product/deactivate', [ProductController::class, 'deactivateProduct'])->name('product.deactivateProduct');
    Route::post('/product/delete', [ProductController::class, 'deleteProduct'])->name('product.deleteProduct');

    //Supplier
    Route::get('/supplier', [SupplierController::class, 'index'])->name('supplier.index');
    Route::post('/supplier', [SupplierController::class, 'saveSupplier'])->name('supplier.saveSupplier');
    Route::post('/supplier/update', [SupplierController::class, 'updateSupplier'])->name('supplier.updateSupplier');
    Route::post('/supplier/deactivate', [SupplierController::class, 'deactivateSupplier'])->name('supplier.deactivateSupplier');
    Route::post('/supplier/delete', [SupplierController::class, 'deleteSupplier'])->name('supplier.deleteSupplier');

    //Agent
    Route::get('/agent', [AgentController::class, 'index'])->name('agent.index');
});

require __DIR__.'/auth.php';
