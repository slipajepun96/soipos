<?php

use App\Models\Store;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Store short code (e.g. "KTN"), put in front of every document number:
 * invoices, receipts, stock in/out documents and pre-orders (KTN-SIN2600001).
 * Existing stores get one made from their name; the master admin can change it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('short_code', 6)->nullable()->unique()->after('code');
        });

        foreach (DB::table('stores')->orderBy('created_at')->get(['id', 'name']) as $store) {
            DB::table('stores')->where('id', $store->id)->update([
                'short_code' => Store::makeShortCode($store->name, $store->id),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropUnique(['short_code']);
            $table->dropColumn('short_code');
        });
    }
};
