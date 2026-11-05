<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('document_type')->default('receipt')->after('receipt_no')->index(); // receipt | invoice
            $table->string('customer_company')->nullable()->after('customer_name');
            $table->string('customer_email')->nullable()->after('customer_phone');
            $table->text('customer_address')->nullable()->after('customer_email');
            $table->date('due_date')->nullable()->after('sale_date');
            $table->text('notes')->nullable();
            $table->decimal('amount_tendered', 15, 2)->nullable()->after('amount_paid');
            $table->decimal('balance_due', 15, 2)->default(0)->after('amount_tendered');
            $table->string('payment_status')->default('paid')->after('balance_due')->index(); // paid | partial | unpaid
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->change();
        });

        Schema::create('sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id')->index();
            $table->date('payment_date')->index();
            $table->string('method');
            $table->decimal('amount', 15, 2);
            $table->string('reference')->nullable();
            $table->string('received_by')->nullable();
            $table->timestamps();
        });

        // Existing POS sales were all paid in full at the counter.
        foreach (DB::table('sales')->get() as $sale) {
            DB::table('sales')->where('id', $sale->id)->update([
                'amount_tendered' => $sale->amount_paid,
                'amount_paid' => $sale->total,
                'balance_due' => 0,
                'payment_status' => 'paid',
            ]);
            DB::table('sale_payments')->insert([
                'id' => (string) Str::uuid(),
                'sale_id' => $sale->id,
                'payment_date' => $sale->sale_date,
                'method' => $sale->payment_method,
                'amount' => $sale->total,
                'reference' => $sale->payment_reference,
                'received_by' => $sale->cashier_name,
                'created_at' => $sale->created_at,
                'updated_at' => $sale->created_at,
            ]);
        }
    }

    public function down(): void
    {
        foreach (DB::table('sales')->get() as $sale) {
            if ($sale->amount_tendered !== null) {
                DB::table('sales')->where('id', $sale->id)->update(['amount_paid' => $sale->amount_tendered]);
            }
        }
        Schema::dropIfExists('sale_payments');
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'document_type', 'customer_company', 'customer_email', 'customer_address', 'due_date',
                'notes', 'amount_tendered', 'balance_due', 'payment_status',
            ]);
        });
    }
};
