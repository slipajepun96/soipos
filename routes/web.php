<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SupplierController;
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

    //Supplier
    Route::get('/supplier', [SupplierController::class, 'index'])->name('supplier.index');
    Route::post('/supplier', [SupplierController::class, 'saveSupplier'])->name('supplier.saveSupplier');
    Route::post('/supplier/update', [SupplierController::class, 'updateSupplier'])->name('supplier.updateSupplier');
    Route::post('/supplier/deactivate', [SupplierController::class, 'deactivateSupplier'])->name('supplier.deactivateSupplier');
    Route::post('/supplier/delete', [SupplierController::class, 'deleteSupplier'])->name('supplier.deleteSupplier');
});

require __DIR__.'/auth.php';
