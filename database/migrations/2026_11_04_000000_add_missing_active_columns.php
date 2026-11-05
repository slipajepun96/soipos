<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Brings fresh installs in line with the live schema. Every column is guarded,
 * so this is a no-op on databases that already have them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'product_num_of_measure')) {
                $table->string('product_num_of_measure')->nullable();
            }
            if (!Schema::hasColumn('products', 'is_active')) {
                $table->boolean('is_active')->nullable()->default(true);
            }
        });

        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'is_active')) {
                $table->boolean('is_active')->nullable()->default(true);
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty: these columns may pre-date this migration.
    }
};
