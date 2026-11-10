<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
        'sold_by',
    ];

    /** false = sold without keeping stock (no stock checks, no stock documents). */
    protected $casts = ['track_stock' => 'boolean', 'is_bundle' => 'boolean'];

    /** Only products whose stock is kept. */
    public function scopeStocked($query)
    {
        return $query->where('track_stock', true)->where('is_bundle', false);
    }

    /** Sold by weight: price per kg, quantities in kg (up to 3 decimals). */
    public function isWeighed(): bool
    {
        return $this->sold_by === 'weight';
    }

    /**
     * Products sold by unit must be sold, received and counted in whole units; products sold
     * by weight allow up to 3 decimals (grams). Throws a validation error naming the line.
     *
     * @param  iterable  $items  rows with product_id and the quantity field
     */
    public static function assertQuantities(iterable $items, string $field = 'quantity', string $prefix = 'items'): void
    {
        $items = collect($items);
        $products = static::withoutGlobalScope('store')->whereIn('id', $items->pluck('product_id')->filter())->get()->keyBy('id');
        foreach ($items as $index => $item) {
            $product = $products->get($item['product_id'] ?? null);
            $qty = (float) ($item[$field] ?? 0);
            if (! $product) {
                continue;
            }
            if ($product->isWeighed() ? abs($qty * 1000 - round($qty * 1000)) > 0.0001 : abs($qty - round($qty)) > 0.0001) {
                throw ValidationException::withMessages(["{$prefix}.{$index}.{$field}" => $product->isWeighed()
                    ? "{$product->product_name}: weight can have at most 3 decimals (grams)."
                    : "{$product->product_name} is sold by unit: enter a whole number."]);
            }
        }
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
        if ($this->isWeighed()) {
            return null; // priced per kg: the weight sold is the quantity
        }
        $size = trim(implode(' ', array_filter([$this->product_num_of_measure, $this->product_unit], fn ($v) => $v !== null && $v !== '')));

        return $size === '' ? null : $size;
    }

    /** Name followed by size, e.g. "Spritzer Mineral Water 500 Milliliter". */
    public function displayName(): string
    {
        return trim($this->product_name.' '.$this->sizeLabel());
    }
}
