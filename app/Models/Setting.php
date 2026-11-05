<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Simple key/value store for app settings. Values fall back to config/pos.php.
 */
class Setting extends Model
{
    public const STORE_KEYS = [
        'store_name', 'company_name', 'company_reg_no', 'address', 'phone', 'email', 'receipt_footer',
    ];

    private const CACHE_KEY = 'settings.all';

    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['key', 'value'];

    /** Store details with config defaults for anything not saved yet. */
    public static function store(): array
    {
        $saved = Cache::rememberForever(self::CACHE_KEY, fn () => static::pluck('value', 'key')->all());
        $defaults = config('pos');

        return collect(self::STORE_KEYS)
            ->mapWithKeys(fn ($key) => [$key => array_key_exists($key, $saved) ? $saved[$key] : ($defaults[$key] ?? null)])
            ->all();
    }

    public static function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        Cache::forget(self::CACHE_KEY);
    }
}
