<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
    'name',
    'email',
    'phone',
    'role',
    'is_active',
    'password',
];
public function coolers(): HasMany
{
    return $this->hasMany(Cooler::class);
}
public function addresses(): HasMany
{
    return $this->hasMany(Address::class);
}
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function profile(): HasOne
{
    return $this->hasOne(UserProfile::class);
}

 protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];
}
}