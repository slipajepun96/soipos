<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model
{
    use HasUuids;

    protected $fillable = ['sale_id', 'payment_date', 'method', 'amount', 'reference', 'received_by'];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount' => 'float',
    ];
}
