<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use BelongsToStore;
    use HasUuids;

    protected $fillable = [
        'sale_id', 'product_id', 'product_name', 'product_sku_code', 'product_unit', 'product_size',
        'quantity', 'unit_price', 'line_total', 'option_label', 'option_quantity', 'packs',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'line_total' => 'float',
        'option_quantity' => 'float',
        'packs' => 'float',
    ];
}
