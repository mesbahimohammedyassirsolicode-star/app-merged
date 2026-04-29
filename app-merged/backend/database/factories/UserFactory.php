<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    protected static array $prenoms = [
        'Ahmed', 'Mohammed', 'Omar', 'Youssef', 'Karim', 'Fatima', 'Aicha', 'Laila',
        'Nadia', 'Mehdi', 'Anas', 'Salma', 'Sara', 'Amine', 'Yassine', 'Adil',
    ];

    protected static array $noms = [
        'Alami', 'Benali', 'Tazi', 'Idrissi', 'El Amrani', 'Bennani', 'Ouazzani',
        'Boussaid', 'Chaoui', 'El Khatib', 'Lamrani', 'Berrada', 'Mansouri',
    ];

    public function definition(): array
    {
        $prenom = self::$prenoms[array_rand(self::$prenoms)];
        $nom = self::$noms[array_rand(self::$noms)];

        // [MERGED] Using V1's names but supporting both roles.
        $role = array_rand(array_flip(['student', 'stagiaire']));

        return [
            'name' => "{$prenom} {$nom}",
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => $role,
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }
}
