<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bundles ("Bakul"): a product made of several other products. The bundle is what is
 * sold and shown on the receipt / invoice; stock is taken out of each component.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_bundle')->default(false)->after('track_stock');
        });

        Schema::create('product_bundle_items', function (Blueprint $table) {
            $table->id();
            $table->char('store_id', 36)->index();
            $table->uuid('bundle_product_id')->index();
            $table->uuid('component_product_id')->index();
            $table->unsignedInteger('quantity'); // units of the component in one bundle
            $table->timestamps();
            $table->unique(['bundle_product_id', 'component_product_id'], 'bundle_component_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_bundle_items');
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_bundle');
        });
    }
};
