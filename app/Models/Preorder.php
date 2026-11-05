<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A customer's order from a pre-order form. It becomes a sale when collected at the POS.
 */
class Preorder extends Model
{
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

    /** Next order number, e.g. PO000123. Call inside a transaction. */
    public static function nextNumber(): string
    {
        $last = (int) static::lockForUpdate()
            ->selectRaw('MAX(CAST(SUBSTRING(order_no, 3) AS UNSIGNED)) as n')
            ->value('n');

        return 'PO' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }
}
