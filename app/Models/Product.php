<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Product extends Model
{
    use BelongsToStore;
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing
   
    public static function booted()
    {
        static::creating(function($model)
        {
            $model->id = (string) Str::uuid();
            $model->is_active = '1';
        });
    }

    protected $fillable = [
        'product_category_id',
        'product_name',
        'product_unit',
        'product_sku_code',
        'product_img_address',
        'product_code',
        'product_description',
        'product_price',
        'product_num_of_measure',
        'product_supplier_id',
        'product_low_stock_limit',
        'track_stock',
        'is_bundle',
    ];

    /** false = sold without keeping stock (no stock checks, no stock documents). */
    protected $casts = ['track_stock' => 'boolean', 'is_bundle' => 'boolean'];

    /** Only products whose stock is kept. */
    public function scopeStocked($query)
    {
        return $query->where('track_stock', true)->where('is_bundle', false);
    }

    /** Components of a bundle ("Bakul"); empty for normal products. */
    public function bundleItems()
    {
        return $this->hasMany(ProductBundleItem::class, 'bundle_product_id');
    }

    public function productCategory()
    {
        return $this->belongsTo(\App\Models\ProductCategory::class, 'product_category_id', 'id');
    }

    public function productSupplier()
    {
        return $this->belongsTo(\App\Models\Supplier::class, 'product_supplier_id', 'id');
    }

    /** Size of one unit, e.g. "500 Milliliter" (descriptive only; stock is counted in units). */
    public function sizeLabel(): ?string
    {
        $size = trim(implode(' ', array_filter([$this->product_num_of_measure, $this->product_unit], fn ($v) => $v !== null && $v !== '')));

        return $size === '' ? null : $size;
    }

    /** Name followed by size, e.g. "Spritzer Mineral Water 500 Milliliter". */
    public function displayName(): string
    {
        return trim($this->product_name.' '.$this->sizeLabel());
    }
}
