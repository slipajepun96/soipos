<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A pre-order drive: what can be ordered, and where/when it is picked up.
        Schema::create('preorder_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->uuid('sales_event_id')->nullable()->index();   // collected sales count towards this event
            $table->string('public_token', 40)->unique();
            $table->string('status')->default('open')->index();   // open | closed
            $table->string('pickup_location')->nullable();
            $table->date('pickup_date')->nullable();
            $table->string('pickup_time')->nullable();             // free text, e.g. "10am – 4pm"
            $table->text('remarks')->nullable();                   // shown on the public form
            $table->dateTime('closes_at')->nullable();             // form stops taking orders after this
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // Items offered in a session, e.g. "Strawberry 1 kg" = 1 kg of product Strawberry for RM 30.
        Schema::create('preorder_session_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('preorder_session_id')->index();
            $table->uuid('product_id')->index();
            $table->string('label');
            $table->decimal('unit_quantity', 15, 4)->default(1);   // stock deducted per unit ordered
            $table->decimal('price', 15, 2);
            $table->unsignedInteger('max_per_order')->nullable();
            $table->unsignedInteger('quota')->nullable();          // total units available for the session
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('preorders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_no')->unique();
            $table->uuid('preorder_session_id')->index();
            $table->string('customer_name');
            $table->string('customer_phone', 50);
            $table->text('customer_address')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status')->default('pending')->index(); // pending | collected | cancelled
            $table->uuid('sale_id')->nullable()->index();           // the POS sale made on collection
            $table->timestamp('collected_at')->nullable();
            $table->string('collected_by')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('preorder_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('preorder_id')->index();
            $table->uuid('preorder_session_item_id')->nullable();
            $table->uuid('product_id');
            $table->string('label');
            $table->decimal('unit_quantity', 15, 4);
            $table->unsignedInteger('quantity');                   // units ordered
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preorder_lines');
        Schema::dropIfExists('preorders');
        Schema::dropIfExists('preorder_session_items');
        Schema::dropIfExists('preorder_sessions');
    }
};
