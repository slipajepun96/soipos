<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing
   
    public static function booted()
    {
        static::creating(function($model)
        {
            $model->id = Str::uuid();
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
    ];

    public function productCategory()
    {
        return $this->belongsTo(\App\Models\ProductCategory::class, 'product_category_id', 'id');
    }

    public function productSupplier()
    {
        return $this->belongsTo(\App\Models\Supplier::class, 'product_supplier_id', 'id');
    }
}
