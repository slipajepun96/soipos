<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_events', function (Blueprint $table) {
            $table->boolean('preorder_enabled')->default(false);
            $table->string('public_token', 40)->nullable()->unique();
            $table->string('pickup_location')->nullable();
            $table->date('pickup_date')->nullable();
            $table->string('pickup_time')->nullable();          // free text, e.g. "10am – 4pm"
            $table->text('preorder_remarks')->nullable();       // shown on the public form
            $table->dateTime('preorder_closes_at')->nullable();
            $table->json('preorder_items')->nullable();         // [{key, product_id, label, quantity, price, limit}]
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('source')->nullable()->after('document_type'); // pos | online | invoice
        });
    }

    public function down(): void
    {
        Schema::table('sales', fn (Blueprint $t) => $t->dropColumn('source'));
        Schema::table('sales_events', fn (Blueprint $t) => $t->dropColumn([
            'preorder_enabled', 'public_token', 'pickup_location', 'pickup_date', 'pickup_time',
            'preorder_remarks', 'preorder_closes_at', 'preorder_items',
        ]));
    }
};
