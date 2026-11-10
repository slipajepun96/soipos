<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A partner store selling at the host's joint event. Owned by the host store; the partner's
 * own copy of the event is partner_event_id. Partner-side lookups must drop the store scope.
 */
class SalesEventPartner extends Model
{
    use BelongsToStore;

    protected $fillable = [
        'sales_event_id', 'partner_store_id', 'partner_event_id',
        'settled_amount', 'settled_at', 'settled_by', 'settlement_note',
    ];

    protected $casts = [
        'settled_amount' => 'float',
        'settled_at' => 'datetime',
    ];

    public function partnerStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'partner_store_id');
    }

    /** The link for a partner's copy of an event (crosses stores on purpose). */
    public static function forPartnerEvent(string $partnerEventId): ?self
    {
        return static::withoutGlobalScope('store')->where('partner_event_id', $partnerEventId)->first();
    }
}
