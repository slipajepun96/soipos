<?php

namespace App\Models;

use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Store extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'code', 'short_code', 'is_active'];

    /** Allowed short code: 2-6 capital letters / digits, starting with a letter. */
    public const SHORT_CODE_PATTERN = '/^[A-Z][A-Z0-9]{1,5}$/';

    protected $casts = ['is_active' => 'boolean'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /** Short URL-safe code, e.g. "Kedai Kuantan" -> "kedai-kuantan" (unique). */
    public static function makeCode(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'store';
        $code = $base;
        for ($i = 2; static::where('code', $code)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists(); $i++) {
            $code = "{$base}-{$i}";
        }

        return $code;
    }

    /**
     * Short code for document numbers, made from the name (unique):
     * "Unit Pemasaran" -> "UP", "Kuantan" -> "KUA", taken -> "UP2", "UP3"...
     */
    public static function makeShortCode(string $name, ?string $ignoreId = null): string
    {
        $words = preg_split('/\s+/', trim(preg_replace('/[^A-Za-z0-9 ]+/', ' ', Str::ascii($name))), -1, PREG_SPLIT_NO_EMPTY);
        $base = count($words) > 1
            ? implode('', array_map(fn ($w) => $w[0], array_slice($words, 0, 4)))
            : substr($words[0] ?? '', 0, 3);
        $base = strtoupper($base);
        if (! preg_match('/^[A-Z]/', $base)) {
            $base = 'S'.$base;
        }
        $base = substr(str_pad($base, 2, 'X'), 0, 5);

        $taken = fn (string $c) => DB::table('stores')->where('short_code', $c)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists();
        $code = $base;
        for ($i = 2; $taken($code); $i++) {
            $code = substr($base, 0, 6 - strlen((string) $i)).$i;
        }

        return $code;
    }

    /** Short code of the store the request is working in (null if none). */
    public static function currentShortCode(): ?string
    {
        $id = CurrentStore::id();

        return $id ? static::whereKey($id)->value('short_code') : null;
    }
}
