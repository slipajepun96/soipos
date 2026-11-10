<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A product a store sells at a joint event, at its event price. */
class SalesEventProduct extends Model
{
    use BelongsToStore;

    protected $fillable = ['sales_event_id', 'product_id', 'price'];

    protected $casts = ['price' => 'float'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
