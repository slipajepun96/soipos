<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One component of a bundle ("Bakul"): which product, and how many units per bundle. */
class ProductBundleItem extends Model
{
    use BelongsToStore;

    protected $fillable = ['bundle_product_id', 'component_product_id', 'quantity'];

    protected $casts = ['quantity' => 'float'];

    public function component(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id');
    }
}
