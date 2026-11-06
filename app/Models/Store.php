<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Store extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'code', 'is_active'];

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
}
