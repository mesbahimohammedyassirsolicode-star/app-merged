<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::create([
            'name' => 'EduFlow Academy',
            'address' => '123 Boulevard de l\'Education, Casablanca',
            'phone' => '+212 522 123456',
            'email' => 'contact@eduflow.ma',
            'logo' => 'https://via.placeholder.com/150'
        ]);
    }
}
