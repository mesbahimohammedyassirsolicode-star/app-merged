<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // [MERGED] Added all seeders from V1
        $this->call(RolePermissionSeeder::class);
        $this->call(AdminAccountSeeder::class);
        $this->call(SyncUserRolesSeeder::class);
        $this->call(GimsAcademicSeeder::class);
        $this->call(EnsureFiliereGroupsSeeder::class);
        $this->call(DemoDataSeeder::class);
        $this->call(Tsge1ATimetableSeeder::class);
        $this->call(Tgi2ATimetableSeeder::class);
        $this->call(Tsgmp1ATimetableSeeder::class);
        $this->call(Tsgtl1ATimetableSeeder::class);
        $this->call(Tsdi2ATimetableSeeder::class);
        $this->call(Tsgq2ATimetableSeeder::class);
        $this->call(Begi1ATimetableSeeder::class);
        $this->call(Bemrh1ATimetableSeeder::class);
        $this->call(Beqse1ATimetableSeeder::class);
        $this->call(Betl1ATimetableSeeder::class);
        $this->call(Metl1ATimetableSeeder::class);
        $this->call(Megiq1ATimetableSeeder::class);
        $this->call(Mgrh1ATimetableSeeder::class);
        $this->call(MoroccanStagiairesSeeder::class);
        $this->call(FormateurSimulationSeeder::class);
    }
}
