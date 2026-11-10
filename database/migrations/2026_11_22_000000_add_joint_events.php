<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Joint events: the store that opens the event (the host) sells for partner stores at one
 * POS and collects all the money. Each partner gets its own copy of the event so its sales,
 * stock and reports stay its own; after the event the host settles what it owes each partner.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_event_partners', function (Blueprint $table) {
            $table->id();
            $table->char('store_id', 36)->index();          // host store (owns this row)
            $table->uuid('sales_event_id')->index();         // host's event
            $table->char('partner_store_id', 36)->index();
            $table->uuid('partner_event_id')->index();       // partner's copy of the event
            $table->decimal('settled_amount', 15, 2)->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->string('settled_by')->nullable();
            $table->string('settlement_note')->nullable();
            $table->timestamps();
            $table->unique(['sales_event_id', 'partner_store_id'], 'event_partner_unique');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('joint_checkout_id')->nullable()->after('sales_event_id')->index(); // parts of one joint POS checkout
            $table->char('collected_by_store_id', 36)->nullable()->after('joint_checkout_id'); // host holding the money
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['joint_checkout_id']);
            $table->dropColumn(['joint_checkout_id', 'collected_by_store_id']);
        });
        Schema::dropIfExists('sales_event_partners');
    }
};
