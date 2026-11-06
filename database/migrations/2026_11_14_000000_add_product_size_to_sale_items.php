<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The product's size at the time of sale (e.g. "500 Milliliter"), printed after the name on receipts.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('product_size')->nullable()->after('product_unit');
        });

        DB::statement("
            UPDATE sale_items si
            JOIN products p ON p.id = si.product_id
            SET si.product_size = NULLIF(TRIM(CONCAT_WS(' ', NULLIF(p.product_num_of_measure, ''), NULLIF(p.product_unit, ''))), '')
        ");
    }

    public function down(): void
    {
        Schema::table('sale_items', fn (Blueprint $table) => $table->dropColumn('product_size'));
    }
};
