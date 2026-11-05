<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            $table->string('stock_unit_sales_price')->nullable();
            $table->string('stock_total_sales_price')->nullable();
        });

        Schema::table('stock_docs', function (Blueprint $table) {
            $table->string('stock_doc_total_sales_price')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropColumn(['stock_unit_sales_price', 'stock_total_sales_price']);
        });

        Schema::table('stock_docs', function (Blueprint $table) {
            $table->dropColumn('stock_doc_total_sales_price');
        });
    }
};
