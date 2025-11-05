<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
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

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    Route::get('/about', function () {return Inertia::render('About');})->name('about');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');

    //Product
    Route::get('/product/category', [ProductCategoryController::class, 'index'])->name('productCategories.index');
    Route::post('/product/category/save', [ProductCategoryController::class, 'saveProductCategory'])->name('productCategory.saveProductCategory');
    Route::get('/product', [ProductController::class, 'index'])->name('product.index');
    Route::post('/product', [ProductController::class, 'saveProduct'])->name('product.saveProduct');
    Route::post('/product/deactivate', [ProductController::class, 'deactivateProduct'])->name('product.deactivateProduct');
    Route::post('/product/delete', [ProductController::class, 'deleteProduct'])->name('product.deleteProduct');

    //Supplier
    Route::get('/supplier', [SupplierController::class, 'index'])->name('supplier.index');
    Route::post('/supplier', [SupplierController::class, 'saveSupplier'])->name('supplier.saveSupplier');
    Route::post('/supplier/update', [SupplierController::class, 'updateSupplier'])->name('supplier.updateSupplier');
    Route::post('/supplier/deactivate', [SupplierController::class, 'deactivateSupplier'])->name('supplier.deactivateSupplier');
    Route::post('/supplier/delete', [SupplierController::class, 'deleteSupplier'])->name('supplier.deleteSupplier');
});

require __DIR__.'/auth.php';
