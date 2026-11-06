<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

/**
 * Validation rules limited to the current store. Plain exists:/unique: rules query the
 * table directly, so they would accept another store's product, event or supplier.
 */
class StoreRule
{
    public static function exists(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)->where('store_id', CurrentStore::id());
    }

    public static function unique(string $table, string $column): Unique
    {
        return Rule::unique($table, $column)->where('store_id', CurrentStore::id());
    }
}
