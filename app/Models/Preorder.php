<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A customer's order from a pre-order form. It becomes a sale when collected at the POS.
 */
class Preorder extends Model
{
    use BelongsToStore;
    use HasUuids;

    protected $fillable = [
        'order_no', 'preorder_session_id', 'customer_name', 'customer_phone', 'customer_address', 'notes',
        'total', 'status', 'sale_id', 'collected_at', 'collected_by', 'cancel_reason',
    ];

    protected $casts = [
        'total' => 'float',
        'collected_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(PreorderLine::class)->orderBy('created_at');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PreorderSession::class, 'preorder_session_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Next order number with the store's short code, e.g. KTN-PO000123 (old orders: PO000123).
     * Each store has its own running number. Call inside a transaction.
     */
    public static function nextNumber(): string
    {
        $short = Store::currentShortCode();

        $last = (int) static::withoutGlobalScope('store')->lockForUpdate()
            ->where('order_no', 'REGEXP', '^([A-Z0-9]{1,6}-)?PO[0-9]+$')
            // Without a short code numbers are unprefixed, so they must stay unique across all stores.
            ->when($short, fn ($q) => $q->where(fn ($q) => $q
                ->where('store_id', CurrentStore::id())->orWhere('order_no', 'like', $short.'-%')))
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(order_no, 'PO', -1) AS UNSIGNED)) as n")
            ->value('n');

        return ($short ? $short.'-' : '').'PO'.str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }
}
