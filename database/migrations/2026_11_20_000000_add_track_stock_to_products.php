<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Products that are sold but not kept in stock (e.g. strawberries picked up on site):
 * sales are recorded as usual, but no stock is checked or moved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('track_stock')->default(true)->after('product_low_stock_limit');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('track_stock');
        });
    }
};
