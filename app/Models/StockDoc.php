<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;


class StockDoc extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing
   
    // public static function booted()
    // {
    //     static::creating(function($model)
    //     {
    //         $model->id = self::generateCustomId();
    //     });
    // }

    /**
     * Generate custom ID with format DAYYXXXXXX (where YY is current year)
     * Sequential numbering continues across years
     */
    public static function generateCustomId($stock_doc_type, $opening_stock_date)
    {

        $currentYear = date('y', strtotime($opening_stock_date));

        if($stock_doc_type == 'GRN'){
            $prefix = 'GRN' . $currentYear;
        } else if($stock_doc_type == 'Opening Stock'){
            $prefix = 'OST' . $currentYear;
        // } else if($stock_doc_type == 'Opening Stock'){
        //     $prefix = 'OST' . $currentYear;
        } else {
            $prefix = 'SDO' . $currentYear;
        }
        
        // Find the highest existing ID across ALL years to continue sequence
        $lastAgent = self::where('id', 'REGEXP', '^[A-Z][A-Z][A-Z][0-9]{2}[0-9]{7}$')
                         ->orderByRaw('CAST(SUBSTRING(id, 6) AS UNSIGNED) DESC')
                         ->first();
        
        if ($lastAgent) {
            // Extract the number part from any year and increment it
            $lastNumber = (int) substr($lastAgent->id, 5); // Skip "GRNXX" to get number
            $nextNumber = $lastNumber + 1;
        } else {
            // Start from 1 if no records exist
            $nextNumber = 1;
        }
        
        // Format the number with leading zeros (6 digits)
        $paddedNumber = str_pad($nextNumber, 7, '0', STR_PAD_LEFT);
        
        return $prefix . $paddedNumber;
    }

    protected $fillable = [
        'stock_doc_type',
        'stock_doc_supplier_id',
        'stock_doc_supplier_name',
        'stock_doc_supplier_rob_num',
        'stock_doc_supplier_address',
        'stock_doc_supplier_phone_num',
        'stock_doc_supplier_email',
        'stock_doc_date',
        'stock_doc_year',
        'stock_doc_month',
        'stock_doc_total_cost',
        'stock_doc_added_by',
        'verified_status',
        'verified_by',
    ];
}