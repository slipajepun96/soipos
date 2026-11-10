<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Products a store sells at a joint event, with its event price. Each store chooses its own
 * list on its own copy of the event; the joint POS only shows these, at these prices.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_event_products', function (Blueprint $table) {
            $table->id();
            $table->char('store_id', 36)->index();
            $table->uuid('sales_event_id')->index();   // this store's own event (host event or partner copy)
            $table->uuid('product_id');
            $table->decimal('price', 15, 2);
            $table->timestamps();
            $table->unique(['sales_event_id', 'product_id'], 'event_product_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_event_products');
    }
};
