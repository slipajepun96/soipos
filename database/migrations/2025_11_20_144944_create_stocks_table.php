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
        Schema::create('stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamps();
            $table->string('stock_doc_type'); //grn, opening stock, stock return, stock adjustment, stock out, sales invoice, stock dispose
            $table->string('stock_doc_num');
            $table->string('stock_entry_type'); //in or out
            $table->string('stock_date');
            $table->string('stock_year');
            $table->string('stock_month');
            $table->string('stock_supplier_id')->foreign();
            $table->string('stock_product_id')->foreign();
            $table->string('stock_product_name');
            $table->string('stock_product_unit');
            $table->string('stock_number_of_measure');
            $table->string('stock_quantity');
            $table->string('stock_unit_cost')->nullable();
            $table->string('stock_total_cost')->nullable();
            $table->string('stock_expiry_date')->nullable();
            $table->string('stock_remarks')->nullable();
            $table->string('stock_added_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
