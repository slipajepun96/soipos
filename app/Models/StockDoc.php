<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;


class StockDoc extends Model
{
    use BelongsToStore;
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing

    /**
     * Generate a readable stock doc number (e.g. GRN2500001, OST2500001)
     * Sequential numbering continues across all doc types.
     */
    public static function generateCustomId($stock_doc_type, $stock_doc_date)
    {
        $currentYear = date('y', strtotime($stock_doc_date));

        if ($stock_doc_type === 'GRN') {
            $prefix = 'GRN' . $currentYear;
        } elseif ($stock_doc_type === 'Opening Stock') {
            $prefix = 'OST' . $currentYear;
        } elseif ($stock_doc_type === 'Sales Invoice') {
            $prefix = 'SIN' . $currentYear;
        } elseif ($stock_doc_type === 'Item Disposal Note') {
            $prefix = 'IDN' . $currentYear;
        } elseif ($stock_doc_type === 'Stock Adjustment') {
            $prefix = 'ADJ' . $currentYear;
        } else {
            $prefix = 'SDO' . $currentYear;
        }

        // Highest number used so far. Sales keep their number after a void deletes
        // the stock document, so they are checked too; numbers are never reused.
        $pattern = '^[A-Z]{3}[0-9]{2}[0-9]{7}$';
        // Across all stores: these numbers are primary keys / unique.
        $fromDocs = (int) self::withoutGlobalScope('store')->where(function ($query) use ($pattern) {
                $query->where('stock_doc_num', 'REGEXP', $pattern)->orWhere('id', 'REGEXP', $pattern);
            })
            ->selectRaw('MAX(CAST(SUBSTRING(COALESCE(stock_doc_num, id), 6) AS UNSIGNED)) as n')
            ->value('n');
        $fromSales = \Illuminate\Support\Facades\Schema::hasTable('sales')
            ? (int) \App\Models\Sale::withoutGlobalScope('store')->where('receipt_no', 'REGEXP', $pattern)
                ->selectRaw('MAX(CAST(SUBSTRING(receipt_no, 6) AS UNSIGNED)) as n')
                ->value('n')
            : 0;

        $nextNumber = max($fromDocs, $fromSales) + 1;

        return $prefix . str_pad($nextNumber, 7, '0', STR_PAD_LEFT);
    }

    protected $fillable = [
        'stock_doc_num',
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
        'stock_doc_total_sales_price',
        'stock_doc_added_by',
        'transportation_mode',
        'remarks',
        'verified_status',
        'verified_by',
    ];
}