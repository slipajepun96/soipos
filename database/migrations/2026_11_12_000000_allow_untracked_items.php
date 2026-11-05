<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Items that are not in the product list (e.g. strawberries bought in for a pre-order):
 * they are sold and reported, but no stock is moved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('preorder_session_items', fn (Blueprint $t) => $t->uuid('product_id')->nullable()->change());
        Schema::table('preorder_lines', fn (Blueprint $t) => $t->uuid('product_id')->nullable()->change());
        Schema::table('sale_items', fn (Blueprint $t) => $t->string('product_id')->nullable()->change());
    }

    public function down(): void
    {
        // Untracked rows would block making the columns required again, so leave them nullable.
    }
};
