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
use Illuminate\Support\Collection;
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

    public function canonicalRole(): string
    {
        $role = strtolower(trim((string) ($this->role ?? '')));

        return match ($role) {
            'teacher' => 'formateur',
            'student' => 'stagiaire',
            default => $role,
        };
    }

    public function hasAnyRole(string ...$roles): bool
    {
        $canonical = $this->canonicalRole();

        foreach ($roles as $role) {
            $candidate = strtolower(trim($role));
            if ($candidate === '') {
                continue;
            }

            $candidate = match ($candidate) {
                'teacher' => 'formateur',
                'student' => 'stagiaire',
                default => $candidate,
            };

            if ($candidate === $canonical) {
                return true;
            }
        }

        return false;
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    public function hasPermission(string $slug): bool
    {
        return $this->roles()->whereHas('permissions', fn ($q) => $q->where('slug', $slug))->exists();
    }

    /**
     * DB permissions merged with config/rbac.php fallback (single source for API + middleware).
     */
    public function effectivePermissionSlugs(): Collection
    {
        $role = $this->canonicalRole();
        $aliases = (array) config('rbac.role_slug_aliases', []);
        $lookupRoles = array_values(array_unique(array_filter([$role, $aliases[$role] ?? null])));

        $fromConfig = collect();
        foreach ($lookupRoles as $r) {
            $fromConfig = $fromConfig->merge((array) config('rbac.role_permissions.'.$r, []));
        }

        $fromDb = collect();
        if ($this->relationLoaded('roles')) {
            foreach ($this->roles as $roleModel) {
                $fromDb = $fromDb->merge(
                    $roleModel->relationLoaded('permissions')
                        ? $roleModel->permissions->pluck('slug')
                        : $roleModel->permissions()->pluck('slug')
                );
            }
        } else {
            $fromDb = $this->roles()->with('permissions')->get()
                ->flatMap(fn (Role $roleModel) => $roleModel->permissions->pluck('slug'));
        }

        return $fromDb->merge($fromConfig)->unique()->values();
    }

    public function hasEffectivePermission(string $slug): bool
    {
        return $this->effectivePermissionSlugs()->contains($slug);
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'module_trainer', 'user_id', 'module_id')->withTimestamps();
    }

    public function legacyModules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'formateur_module', 'user_id', 'module_id')->withTimestamps();
    }

    public function trainerModules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'module_trainer', 'user_id', 'module_id')->withTimestamps();
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
