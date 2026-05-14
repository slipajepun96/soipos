<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamps();
            $table->string('product_category_id');
            $table->string('product_name');
            $table->string('product_unit');
            $table->string('product_sku_code')->nullable();
            $table->string('product_img_address')->nullable();
            $table->string('product_code');
            $table->string('product_description')->nullable();
            $table->string('product_price');
            $table->string('product_weight')->nullable();
            $table->string('product_supplier_id');
            $table->string('product_low_stock_limit')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
