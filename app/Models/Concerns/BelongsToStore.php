<?php

namespace App\Models\Concerns;

use App\Models\Store;
use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Data owned by one store: queries only see the current store's rows, and new rows
 * are stamped with it. Use withoutGlobalScope('store') only where a lookup must cross
 * stores on purpose (public links, master admin, number sequences).
 */
trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope('store', function (Builder $query) {
            $column = $query->getModel()->qualifyColumn('store_id');
            ($id = CurrentStore::id()) !== null
                ? $query->where($column, $id)
                : $query->whereRaw('1 = 0'); // no store selected: show nothing
        });

        static::creating(function ($model) {
            if (empty($model->store_id)) {
                $model->store_id = CurrentStore::id()
                    ?? throw new LogicException('No store selected for new '.class_basename($model).'.');
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
