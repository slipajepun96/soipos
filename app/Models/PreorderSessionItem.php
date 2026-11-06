<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreorderSessionItem extends Model
{
    use BelongsToStore;
    use HasUuids;

    protected $fillable = [
        'preorder_session_id', 'product_id', 'label', 'unit_quantity', 'price', 'max_per_order', 'quota', 'sort_order',
    ];

    protected $casts = [
        'unit_quantity' => 'float',
        'price' => 'float',
        'max_per_order' => 'integer',
        'quota' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
