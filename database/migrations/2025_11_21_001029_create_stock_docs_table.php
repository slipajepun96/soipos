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
        Schema::create('stock_docs', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            // $table->string('stock_doc_name');
            $table->string('stock_doc_type');
            $table->string('stock_doc_supplier_id');
            $table->string('stock_doc_supplier_name');
            $table->string('stock_doc_supplier_rob_num');
            $table->string('stock_doc_supplier_address');
            $table->string('stock_doc_supplier_phone_num')->nullable();
            $table->string('stock_doc_supplier_email')->nullable();
            $table->string('stock_doc_date');
            $table->string('stock_doc_year');
            $table->string('stock_doc_month');
            $table->string('stock_doc_total_cost');
            $table->string('stock_doc_added_by');
            $table->string('verified_status')->default('pending');
            $table->string('verified_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_docs');
    }
};
