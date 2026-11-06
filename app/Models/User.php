<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
    ];

    /** Same as the database defaults, so new (unsaved/unrefreshed) users behave alike. */
    protected $attributes = [
        'is_master_admin' => false,
        'is_active' => true,
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_master_admin' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * users.id is a number on fresh installs but a UUID on some databases.
     * Follow the database so new users (created by the master admin) get a valid id.
     */
    private static ?bool $uuidKeys = null;

    public static function usesUuidKeys(): bool
    {
        return self::$uuidKeys ??= in_array(Schema::getColumnType('users', 'id'), ['char', 'varchar', 'string', 'uuid'], true);
    }

    public function getIncrementing()
    {
        return ! static::usesUuidKeys();
    }

    public function getKeyType()
    {
        return static::usesUuidKeys() ? 'string' : 'int';
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (static::usesUuidKeys() && ! $user->getKey()) {
                $user->{$user->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    /** Stores this user may log in to. */
    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class)->withTimestamps();
    }

    /** Assigned staff, or any master admin, may work in an open store. */
    public function canUseStore(?string $storeId): bool
    {
        if ($storeId === null) {
            return false;
        }
        if ($this->is_master_admin) {
            return Store::whereKey($storeId)->where('is_active', true)->exists();
        }

        return $this->stores()->whereKey($storeId)->where('is_active', true)->exists();
    }
}
