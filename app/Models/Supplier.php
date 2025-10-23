<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Supplier extends Model
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
        'supplier_name',
        'supplier_address',
        'supplier_rob_num',
        'supplier_contact_person',
        'supplier_phone_num',
        'supplier_email',
        'supplier_tax_identification_num',
        'supplier_remark',
        'is_active',
    ];
}
