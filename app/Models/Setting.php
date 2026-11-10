<?php

namespace App\Models;

use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Key/value settings per store (store_id + key). The store name falls back to the
 * store's own name; other details are blank until the store fills them in.
 */
class Setting extends Model
{
    public const STORE_KEYS = [
        'store_name', 'company_name', 'company_reg_no', 'address', 'phone', 'email', 'receipt_footer',
        'duitnow_qr', // URL path of the store's DuitNow QR picture, shown at the POS for e-wallet payments
        'bank_name', 'bank_account_no', 'bank_account_name', // shown on invoices and at the POS for bank transfers
    ];

    public $incrementing = false;
    protected $fillable = ['store_id', 'key', 'value'];

    private static function cacheKey(string $storeId): string
    {
        return "settings.store.{$storeId}";
    }

    /** Store details for the current store (or the given one). */
    public static function store(?string $storeId = null): array
    {
        $storeId ??= CurrentStore::id();
        if (! $storeId) {
            return array_fill_keys(self::STORE_KEYS, null);
        }

        $saved = Cache::rememberForever(self::cacheKey($storeId),
            fn () => DB::table('settings')->where('store_id', $storeId)->pluck('value', 'key')->all());
        $defaults = ['store_name' => Store::whereKey($storeId)->value('name'), 'receipt_footer' => 'Thank you. Please come again.'];

        return collect(self::STORE_KEYS)
            ->mapWithKeys(fn ($key) => [$key => array_key_exists($key, $saved) ? $saved[$key] : ($defaults[$key] ?? null)])
            ->all();
    }

    /** The store's bank account for transfers, or null when not set. */
    public static function bankAccount(?string $storeId = null): ?array
    {
        $s = self::store($storeId);
        if (! $s['bank_name'] || ! $s['bank_account_no']) {
            return null;
        }

        return ['bank_name' => $s['bank_name'], 'account_no' => $s['bank_account_no'], 'account_name' => $s['bank_account_name'] ?: ($s['company_name'] ?: $s['store_name'])];
    }

    public static function setMany(array $values, ?string $storeId = null): void
    {
        $storeId ??= CurrentStore::id() ?? throw new \LogicException('No store selected.');
        foreach ($values as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['store_id' => $storeId, 'key' => $key],
                ['value' => $value, 'updated_at' => now(), 'created_at' => now()],
            );
        }
        Cache::forget(self::cacheKey($storeId));
    }
}
