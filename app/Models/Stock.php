<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Stock extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // set the key type to UUID
    public $incrementing = false; // disable auto-incrementing
   
    public static function booted()
    {
        static::creating(function($model)
        {
            $model->id = Str::uuid();
        });
    }

    protected $fillable = [
        'stock_doc_type',
        'stock_doc_num',
        'stock_entry_type',
        'stock_date',
        'stock_year',
        'stock_month',
        'stock_supplier_id',
        'stock_product_id',
        'stock_product_name',
        'stock_product_unit',
        'stock_number_of_measure',
        'stock_quantity',
        'stock_unit_cost',
        'stock_total_cost',
        'stock_expiry_date',
        'stock_remarks',
        'stock_added_by',
    ];
}
