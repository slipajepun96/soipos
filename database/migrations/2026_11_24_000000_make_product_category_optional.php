<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A product's category is optional. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_category_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Uncategorised products would block making the column required again, so leave it nullable.
    }
};
