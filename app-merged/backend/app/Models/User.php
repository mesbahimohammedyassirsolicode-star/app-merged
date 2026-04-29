<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\Auditable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Auditable, HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'is_active',
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
        ];
    }

    public function administrator()
    {
        return $this->hasOne(Administrator::class);
    }

    public function formateur()
    {
        return $this->hasOne(Formateur::class);
    }

    public function stagiaire()
    {
        return $this->hasOne(Stagiaire::class);
    }

    public function parent()
    {
        return $this->hasOne(StudentParent::class, 'user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')->withTimestamps();
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    public function hasPermission(string $slug): bool
    {
        return $this->roles()->whereHas('permissions', fn ($q) => $q->where('slug', $slug))->exists();
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'formateur_module', 'user_id', 'module_id')->withTimestamps();
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Groupe::class, 'formateur_group', 'user_id', 'groupe_id')->withTimestamps();
    }

    public function assignments(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'formateur_module_group', 'user_id', 'module_id')
            ->withPivot('groupe_id')
            ->withTimestamps();
    }
}
