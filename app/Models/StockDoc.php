<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;

class StockDoc extends Model
{
    use BelongsToStore;
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID

    public $incrementing = false; // Disable auto-incrementing

    /**
     * Generate a readable document number, prefixed with the store's short code:
     * e.g. KTN-GRN2600001, KTN-SIN2600002 (old documents may have no prefix: GRN2500001).
     * Each store has its own running number, shared by all doc types and sales.
     */
    public static function generateCustomId($stock_doc_type, $stock_doc_date)
    {
        $currentYear = date('y', strtotime($stock_doc_date));

        $type = match ($stock_doc_type) {
            'GRN' => 'GRN',
            'Opening Stock' => 'OST',
            'Sales Invoice' => 'SIN',
            'Item Disposal Note' => 'IDN',
            'Stock Adjustment' => 'ADJ',
            default => 'SDO',
        };

        $storeId = CurrentStore::id();
        $short = Store::currentShortCode();
        $prefix = ($short ? $short.'-' : '').$type.$currentYear;

        // Highest running number used so far by this store (with or without the prefix),
        // plus anything already carrying this short code (e.g. a store that used it before).
        // Sales keep their number after a void deletes the stock document, so they are
        // checked too; numbers are never reused.
        $pattern = '^([A-Z0-9]{1,6}-)?[A-Z]{3}[0-9]{9}$';
        // Without a short code numbers are unprefixed, so they must stay unique across all stores.
        $scope = fn (string $column) => function ($query) use ($column, $storeId, $short) {
            if ($short) {
                $query->where('store_id', $storeId)->orWhere($column, 'like', $short.'-%');
            }
        };

        $fromDocs = (int) self::withoutGlobalScope('store')
            ->where($scope('stock_doc_num'))
            ->where(fn ($q) => $q->where('stock_doc_num', 'REGEXP', $pattern)->orWhere('id', 'REGEXP', $pattern))
            ->selectRaw('MAX(CAST(RIGHT(COALESCE(stock_doc_num, id), 7) AS UNSIGNED)) as n')
            ->value('n');
        $fromSales = Schema::hasTable('sales')
            ? (int) Sale::withoutGlobalScope('store')
                ->where($scope('receipt_no'))
                ->where('receipt_no', 'REGEXP', $pattern)
                ->selectRaw('MAX(CAST(RIGHT(receipt_no, 7) AS UNSIGNED)) as n')
                ->value('n')
            : 0;

        $nextNumber = max($fromDocs, $fromSales) + 1;

        return $prefix.str_pad($nextNumber, 7, '0', STR_PAD_LEFT);
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
