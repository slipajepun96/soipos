<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreorderLine extends Model
{
    use HasUuids;

    protected $fillable = [
        'preorder_id', 'preorder_session_item_id', 'product_id', 'label', 'unit_quantity', 'quantity',
        'unit_price', 'line_total',
    ];

    protected $casts = [
        'unit_quantity' => 'float',
        'quantity' => 'integer',
        'unit_price' => 'float',
        'line_total' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
