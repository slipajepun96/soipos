<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Products sold by weight (e.g. strawberries): price is per kg and quantities are kg with
 * up to 3 decimals. Bakul items may then be part of a kg too.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sold_by', 10)->default('unit')->after('product_unit'); // unit | weight
        });
        Schema::table('product_bundle_items', function (Blueprint $table) {
            $table->decimal('quantity', 15, 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('sold_by');
        });
    }
};
