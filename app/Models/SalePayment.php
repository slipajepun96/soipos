<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SalePayment extends Model
{
    use BelongsToStore;
    use HasUuids;

    /** Proof photos hold customers' bank details, so they live on the private disk. */
    public const PROOF_DISK = 'local';

    protected $fillable = ['sale_id', 'payment_date', 'method', 'amount', 'reference', 'received_by', 'proof_path'];

    protected $hidden = ['proof_path'];

    protected $appends = ['proof_url'];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount' => 'float',
    ];

    protected static function booted(): void
    {
        static::deleted(fn (self $payment) => $payment->deleteProofFile());
    }

    /** Where staff can view the proof photo (signed-in, same store only). */
    public function getProofUrlAttribute(): ?string
    {
        return $this->proof_path
            ? route('sales.payments.proof.show', [$this->sale_id, $this->id]) . '?v=' . substr(md5($this->proof_path), 0, 8)
            : null;
    }

    public function deleteProofFile(): void
    {
        if ($this->proof_path) {
            Storage::disk(self::PROOF_DISK)->delete($this->proof_path);
        }
    }
}
