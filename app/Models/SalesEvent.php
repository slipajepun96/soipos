<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A special event (bazaar, expo, roadshow…) that sales can be tagged with.
 */
class SalesEvent extends Model
{
    use BelongsToStore;
    use HasUuids;

    protected $fillable = [
        'name', 'location', 'start_date', 'end_date', 'notes', 'status', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /** Partner stores of a joint event this store hosts. */
    public function partners(): HasMany
    {
        return $this->hasMany(SalesEventPartner::class);
    }
}
