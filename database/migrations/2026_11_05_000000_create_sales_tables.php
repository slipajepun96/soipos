<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('receipt_no')->unique();
            $table->string('stock_doc_num')->nullable()->index();
            $table->date('sale_date')->index();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->string('payment_method');
            $table->string('payment_reference')->nullable();
            $table->decimal('amount_paid', 15, 2);
            $table->decimal('change_due', 15, 2)->default(0);
            $table->string('status')->default('completed')->index();
            $table->string('void_reason')->nullable();
            $table->string('voided_by')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->string('cashier_id')->nullable();
            $table->string('cashier_name')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id')->index();
            $table->string('product_id');
            $table->string('product_name');
            $table->string('product_sku_code')->nullable();
            $table->string('product_unit')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
