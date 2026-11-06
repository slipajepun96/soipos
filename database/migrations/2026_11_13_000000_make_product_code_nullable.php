<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Barcode and supplier are optional on the product form, so the columns must allow empty.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_code')->nullable()->change();
            $table->string('product_supplier_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_code')->nullable(false)->change();
            $table->string('product_supplier_id')->nullable(false)->change();
        });
    }
};
