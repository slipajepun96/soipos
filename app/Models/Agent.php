<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Agent extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string'; // Set the key type to UUID
    public $incrementing = false; // Disable auto-incrementing
   
    public static function booted()
    {
        static::creating(function($model)
        {
            $model->id = self::generateCustomId();
        });
    }

    /**
     * Generate custom ID with format DAYYXXXXXX (where YY is current year)
     * Sequential numbering continues across years
     */
    public static function generateCustomId()
    {
        // Get current year (last 2 digits)
        $currentYear = date('y'); // '25' for 2025, '26' for 2026, etc.
        $prefix = 'DA' . $currentYear;
        
        // Find the highest existing ID across ALL years to continue sequence
        $lastAgent = self::where('id', 'REGEXP', '^DA[0-9]{2}[0-9]{6}$')
                         ->orderByRaw('CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC')
                         ->first();
        
        if ($lastAgent) {
            // Extract the number part from any year and increment it
            $lastNumber = (int) substr($lastAgent->id, 4); // Skip "DAXX" to get number
            $nextNumber = $lastNumber + 1;
        } else {
            // Start from 1 if no records exist
            $nextNumber = 1;
        }
        
        // Format the number with leading zeros (6 digits)
        $paddedNumber = str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
        
        return $prefix . $paddedNumber;
    }

    protected $fillable = [
        'agent_name',
        'agent_nric',
        'agent_address',
        'agent_phone_num',
        'agent_email',
        'agent_social_media',
        'agent_social_media_link',
        'agent_status',
    ];
}
