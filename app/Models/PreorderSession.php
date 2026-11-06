<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * A pre-order drive with a public order form.
 */
class PreorderSession extends Model
{
    use BelongsToStore;
    use HasUuids;

    protected $fillable = [
        'name', 'sales_event_id', 'public_token', 'status', 'pickup_location', 'pickup_date',
        'pickup_time', 'remarks', 'closes_at', 'created_by',
    ];

    protected $casts = [
        'pickup_date' => 'date:Y-m-d',
        'closes_at' => 'datetime:Y-m-d\TH:i',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $session) {
            $session->public_token ??= self::newToken();
        });
    }

    public static function newToken(): string
    {
        return Str::lower(Str::random(24));
    }

    public function items(): HasMany
    {
        return $this->hasMany(PreorderSessionItem::class)->orderBy('sort_order');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Preorder::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(SalesEvent::class, 'sales_event_id');
    }

    /** Whether the public form takes orders right now. */
    public function acceptingOrders(): bool
    {
        return $this->status === 'open'
            && ($this->closes_at === null || $this->closes_at->isFuture())
            && $this->items()->exists();
    }

    public function publicUrl(): string
    {
        return route('preorder.form', $this->public_token);
    }
}
