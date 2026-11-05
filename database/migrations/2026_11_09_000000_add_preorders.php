<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_preorder')->default(false);
            $table->json('preorder_options')->nullable(); // [{label, quantity, price}]
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('fulfilment_status')->nullable()->after('payment_status')->index(); // pending | ready | collected
            $table->date('collection_date')->nullable()->after('due_date')->index();
            $table->timestamp('collected_at')->nullable();
            $table->string('collected_by')->nullable();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('option_label')->nullable()->after('product_unit');
            $table->decimal('option_quantity', 15, 4)->nullable()->after('option_label');
            $table->decimal('packs', 15, 4)->nullable()->after('option_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', fn (Blueprint $t) => $t->dropColumn(['option_label', 'option_quantity', 'packs']));
        Schema::table('sales', fn (Blueprint $t) => $t->dropColumn(['fulfilment_status', 'collection_date', 'collected_at', 'collected_by']));
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn(['is_preorder', 'preorder_options']));
    }
};
