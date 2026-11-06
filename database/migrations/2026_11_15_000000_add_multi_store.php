<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Multiple stores. Every business table gets store_id; existing data moves into a first
 * store (named after the current shop), and existing users are assigned to it.
 */
return new class extends Migration
{
    /** Tables whose rows belong to one store. */
    private const TABLES = [
        'agents', 'product_categories', 'products', 'suppliers', 'stocks', 'stock_docs',
        'sales', 'sale_items', 'sale_payments', 'sales_events',
        'preorder_sessions', 'preorder_session_items', 'preorders', 'preorder_lines',
    ];

    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();      // used in public links, e.g. /agent/register/{code}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // users.id is a number on fresh installs but a UUID on some databases: match it.
        $uuidUsers = in_array(Schema::getColumnType('users', 'id'), ['char', 'varchar', 'string', 'uuid'], true);
        Schema::create('store_user', function (Blueprint $table) use ($uuidUsers) {
            $table->id();
            $table->foreignUuid('store_id')->constrained()->cascadeOnDelete();
            $uuidUsers
                ? $table->foreignUuid('user_id')->constrained()->cascadeOnDelete()
                : $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['store_id', 'user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_master_admin')->default(false)->after('email');
            $table->boolean('is_active')->default(true)->after('is_master_admin');
        });

        // First store, carrying the current shop's details.
        $saved = DB::table('settings')->pluck('value', 'key');
        $name = $saved['store_name'] ?? config('pos.store_name') ?? 'Main Store';
        $storeId = (string) Str::uuid();
        DB::table('stores')->insert([
            'id' => $storeId, 'name' => $name, 'code' => Str::slug($name) ?: 'main',
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);

        foreach (self::TABLES as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->char('store_id', 36)->nullable()->after('id')->index());
            DB::table($name)->update(['store_id' => $storeId]);
            Schema::table($name, fn (Blueprint $table) => $table->char('store_id', 36)->nullable(false)->change());
        }

        // Agents: the same IC can sign up with different stores.
        Schema::table('agents', function (Blueprint $table) {
            $table->dropUnique('agents_agent_nric_unique');
            $table->unique(['store_id', 'agent_nric']);
        });

        // Settings per store: keep what was saved, and fill the rest from config
        // so the first store's receipts look exactly as before.
        Schema::table('settings', function (Blueprint $table) {
            $table->dropPrimary();
            $table->char('store_id', 36)->nullable()->first();
        });
        DB::table('settings')->update(['store_id' => $storeId]);
        foreach (['store_name', 'company_name', 'company_reg_no', 'address', 'phone', 'email', 'receipt_footer'] as $key) {
            if (! $saved->has($key) && config("pos.$key") !== null) {
                DB::table('settings')->insert(['store_id' => $storeId, 'key' => $key, 'value' => config("pos.$key"), 'created_at' => now(), 'updated_at' => now()]);
            }
        }
        Schema::table('settings', function (Blueprint $table) {
            $table->char('store_id', 36)->nullable(false)->change();
            $table->primary(['store_id', 'key']);
        });

        $now = now();
        DB::table('store_user')->insert(
            DB::table('users')->pluck('id')->map(fn ($id) => ['store_id' => $storeId, 'user_id' => $id, 'created_at' => $now, 'updated_at' => $now])->all()
        );
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropPrimary();
        });
        $first = DB::table('stores')->orderBy('created_at')->value('id');
        DB::table('settings')->where('store_id', '!=', $first)->delete();
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn('store_id');
            $table->primary('key');
        });

        Schema::table('agents', function (Blueprint $table) {
            $table->dropUnique(['store_id', 'agent_nric']);
            $table->unique('agent_nric');
        });
        foreach (self::TABLES as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('store_id'));
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['is_master_admin', 'is_active']));
        Schema::dropIfExists('store_user');
        Schema::dropIfExists('stores');
    }
};
