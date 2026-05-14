<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;


class ProductCategory extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing
   
    public static function booted()
    {
        static::creating(function($model)
        {
            $model->id = Str::uuid();
            // $model->is_active = '1';
        });
    }

    protected $fillable = [
        'product_categories_name',
        'product_categories_sub_level',//1 -main , 2 - sub , 3 - sub(size)
        'product_categories_parent_uuid',
    ];

    public function products()
    {
        return $this->hasMany(\App\Models\Product::class, 'product_category_id', 'id');
    }
}
