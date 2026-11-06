<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use BelongsToStore;
    use HasUuids;

    public const PAYMENT_METHODS = ['Cash', 'Card', 'E-Wallet', 'Bank Transfer'];

    protected $fillable = [
        'receipt_no', 'document_type', 'sales_event_id', 'stock_doc_num', 'sale_date', 'due_date',
        'customer_name', 'customer_company', 'customer_phone', 'customer_email', 'customer_address',
        'subtotal', 'discount', 'total', 'payment_method', 'payment_reference',
        'amount_paid', 'amount_tendered', 'balance_due', 'payment_status', 'change_due',
        'status', 'void_reason', 'voided_by', 'voided_at', 'notes',
        'cashier_id', 'cashier_name',
    ];

    protected $casts = [
        'sale_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
        'voided_at' => 'datetime',
        'subtotal' => 'float',
        'discount' => 'float',
        'total' => 'float',
        'amount_paid' => 'float',
        'amount_tendered' => 'float',
        'balance_due' => 'float',
        'change_due' => 'float',
    ];

    protected $appends = ['is_overdue'];

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(SalesEvent::class, 'sales_event_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class)->orderBy('payment_date')->orderBy('created_at');
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'completed'
            && $this->balance_due > 0
            && $this->due_date !== null
            && $this->due_date->lt(now()->startOfDay());
    }

    /** Recalculate paid amount, balance and payment status from the payments. */
    public function refreshBalance(): void
    {
        $paid = round((float) $this->payments()->sum('amount'), 2);
        $balance = round($this->total - $paid, 2);

        $this->update([
            'amount_paid' => $paid,
            'balance_due' => max(0, $balance),
            'payment_status' => $balance <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
        ]);
    }
}
