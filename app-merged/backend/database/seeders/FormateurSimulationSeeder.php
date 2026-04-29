<?php

namespace Database\Seeders;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Role;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FormateurSimulationSeeder extends Seeder
{
    private function ensureAssignedWeeklySeancesExist(): void
    {
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekStart = $startOfWeek->toDateString();
        $weekEnd = $startOfWeek->copy()->addDays(6)->toDateString();

        $assignmentRows = DB::table('formateur_module_group as fmg')
            ->join('groupes as g', 'g.id', '=', 'fmg.groupe_id')
            ->select('fmg.user_id', 'fmg.module_id', 'fmg.groupe_id', 'g.filiere_id')
            ->orderBy('fmg.user_id')
            ->orderBy('fmg.module_id')
            ->get();

        if ($assignmentRows->isEmpty()) {
            return;
        }

        $slots = [
            ['day' => 0, 'start' => '08:30:00', 'end' => '10:30:00'],
            ['day' => 1, 'start' => '10:45:00', 'end' => '12:45:00'],
            ['day' => 2, 'start' => '14:00:00', 'end' => '16:00:00'],
            ['day' => 3, 'start' => '08:30:00', 'end' => '10:30:00'],
            ['day' => 4, 'start' => '14:00:00', 'end' => '16:00:00'],
        ];

        foreach ($assignmentRows as $idx => $row) {
            $exists = Seance::query()
                ->where('user_id', (int) $row->user_id)
                ->where('module_id', (int) $row->module_id)
                ->where('groupe_id', (int) $row->groupe_id)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->exists();

            if ($exists) {
                continue;
            }

            $slot = $slots[$idx % count($slots)];
            Seance::create([
                'user_id' => (int) $row->user_id,
                'module_id' => (int) $row->module_id,
                'groupe_id' => (int) $row->groupe_id,
                'filiere_id' => $row->filiere_id ? (int) $row->filiere_id : null,
                'date' => $startOfWeek->copy()->addDays((int) $slot['day'])->toDateString(),
                'start_time' => $slot['start'],
                'end_time' => $slot['end'],
                'salle' => 'SIM-'.str_pad((string) (($idx % 9) + 1), 2, '0', STR_PAD_LEFT),
                'status' => 'planifie',
                'type' => 'presentiel',
            ]);
        }
    }

    public function run(): void
    {
        $academicYear = AnneeScolaire::where('is_current', true)->first()
            ?? AnneeScolaire::latest('year_start')->first();

        if (! $academicYear) {
            $this->command?->warn('Formateur simulator skipped: no academic year found.');

            return;
        }

        $filiere = Filiere::query()
            ->whereHas('modules')
            ->whereHas('groupes')
            ->withCount(['modules', 'groupes'])
            ->orderByDesc('modules_count')
            ->first();

        if (! $filiere) {
            $this->command?->warn('Formateur simulator skipped: no filiere with modules/groups found.');

            return;
        }

        $groupe = Groupe::query()
            ->where('filiere_id', $filiere->id)
            ->where('annee_scolaire_id', $academicYear->id)
            ->orderBy('year_level')
            ->orderBy('id')
            ->first()
            ?? Groupe::query()
                ->where('filiere_id', $filiere->id)
                ->orderBy('year_level')
                ->orderBy('id')
                ->first();

        if (! $groupe) {
            $this->command?->warn('Formateur simulator skipped: no groupe found for selected filiere.');

            return;
        }

        $modules = Module::query()
            ->where('filiere_id', $filiere->id)
            ->orderBy('semester')
            ->orderBy('code')
            ->limit(3)
            ->get();

        if ($modules->count() < 2) {
            $this->command?->warn('Formateur simulator skipped: not enough modules for selected filiere.');

            return;
        }

        $user = User::firstOrCreate(
            ['email' => 'formateur.simulation@gims.ma'],
            [
                'name' => 'Youssef El Mansouri',
                'password' => bcrypt('Password123'),
                'role' => 'formateur',
                'is_active' => true,
            ]
        );

        $user->forceFill([
            'name' => 'Youssef El Mansouri',
            'role' => 'formateur',
            'is_active' => true,
        ])->save();

        $teacherRole = Role::where('slug', 'teacher')->first();
        $formateurRole = Role::where('slug', 'formateur')->first();
        $roleIds = array_values(array_filter([$teacherRole?->id, $formateurRole?->id]));
        if ($roleIds !== []) {
            $user->roles()->syncWithoutDetaching($roleIds);
        }

        $formateur = Formateur::firstOrCreate(
            ['user_id' => $user->id],
            [
                'matricule' => 'SIM-FORM-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                'specialty' => 'Ingénierie logicielle',
                'type' => 'permanent',
            ]
        );

        $niveauCode = ((int) $groupe->year_level) === 2 ? '2A' : '1A';
        $formateur->forceFill([
            'filiere_id' => $filiere->id,
            'niveau' => $niveauCode,
            'specialty' => 'Ingénierie logicielle',
        ])->save();

        DB::table('formateur_module_group')->where('user_id', $user->id)->delete();
        DB::table('formateur_group')->where('user_id', $user->id)->delete();
        DB::table('formateur_module')->where('user_id', $user->id)->delete();
        DB::table('teacher_module')->where('teacher_id', $formateur->id)->delete();

        foreach ($modules as $module) {
            DB::table('formateur_module_group')->insert([
                'user_id' => $user->id,
                'module_id' => $module->id,
                'groupe_id' => $groupe->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('formateur_module')->insert([
                'user_id' => $user->id,
                'module_id' => $module->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('teacher_module')->insert([
                'teacher_id' => $formateur->id,
                'module_id' => $module->id,
                'academic_year' => $academicYear->id,
                'semester' => $module->semester ?? 'S2',
                'weekly_hours' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('module_groupe')->updateOrInsert(
                [
                    'module_id' => $module->id,
                    'groupe_id' => $groupe->id,
                    'academic_year' => $academicYear->id,
                    'semester' => $module->semester ?? 'S2',
                ],
                [
                    'planned_hours' => $module->masse_horaire ?? 64,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('formateur_group')->insert([
            'user_id' => $user->id,
            'groupe_id' => $groupe->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $targetStagiaires = 12;
        $linked = Stagiaire::query()
            ->where('filiere_id', $filiere->id)
            ->where('groupe_id', $groupe->id)
            ->limit($targetStagiaires)
            ->get();

        $missing = $targetStagiaires - $linked->count();
        if ($missing > 0) {
            $pool = Stagiaire::query()
                ->where(function ($q) use ($filiere, $groupe) {
                    $q->where('filiere_id', '!=', $filiere->id)
                        ->orWhere('groupe_id', '!=', $groupe->id)
                        ->orWhereNull('filiere_id')
                        ->orWhereNull('groupe_id');
                })
                ->limit($missing)
                ->get();

            foreach ($pool as $stagiaire) {
                $stagiaire->forceFill([
                    'filiere_id' => $filiere->id,
                    'groupe_id' => $groupe->id,
                ])->save();
            }
        }

        $linked = Stagiaire::query()
            ->where('filiere_id', $filiere->id)
            ->where('groupe_id', $groupe->id)
            ->limit($targetStagiaires)
            ->get();

        while ($linked->count() < 10) {
            $idx = $linked->count() + 1;
            $slug = Str::lower("simstagiaire{$idx}".Str::random(4));
            $studentUser = User::create([
                'name' => "Stagiaire Simulation {$idx}",
                'email' => "{$slug}@gims.ma",
                'password' => bcrypt('Password123'),
                'role' => 'student',
                'is_active' => true,
            ]);

            $studentRole = Role::where('slug', 'student')->first();
            if ($studentRole) {
                $studentUser->roles()->syncWithoutDetaching([$studentRole->id]);
            }

            Stagiaire::create([
                'user_id' => $studentUser->id,
                'filiere_id' => $filiere->id,
                'groupe_id' => $groupe->id,
                'cin' => 'SIM'.strtoupper(Str::random(5)),
                'cef_number' => 'SIM'.str_pad((string) ($studentUser->id + 700000), 10, '0', STR_PAD_LEFT),
                'date_naissance' => now()->subYears(20)->format('Y-m-d'),
                'niveau_scolaire' => 'BAC',
                'niveau_formation' => 'TS',
                'status' => 'actif',
            ]);

            $linked = Stagiaire::query()
                ->where('filiere_id', $filiere->id)
                ->where('groupe_id', $groupe->id)
                ->limit($targetStagiaires)
                ->get();
        }

        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekDates = [
            'monday' => $startOfWeek->copy()->toDateString(),
            'tuesday' => $startOfWeek->copy()->addDay()->toDateString(),
            'wednesday' => $startOfWeek->copy()->addDays(2)->toDateString(),
            'thursday' => $startOfWeek->copy()->addDays(3)->toDateString(),
            'friday' => $startOfWeek->copy()->addDays(4)->toDateString(),
        ];

        $moduleIds = $modules->pluck('id')->values();
        $rooms = ['B204', 'Lab Info 2', 'A112'];
        $plan = [
            [$weekDates['monday'], '08:30:00', '10:30:00', 0],
            [$weekDates['monday'], '10:45:00', '12:45:00', 1],
            [$weekDates['tuesday'], '14:00:00', '16:00:00', 2],
            [$weekDates['wednesday'], '09:00:00', '12:00:00', 0],
            [$weekDates['thursday'], '14:00:00', '17:00:00', 1],
            [$weekDates['friday'], '08:30:00', '10:30:00', 2],
        ];

        Seance::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [
                $startOfWeek->toDateString(),
                $startOfWeek->copy()->addDays(6)->toDateString(),
            ])
            ->delete();

        foreach ($plan as [$date, $start, $end, $modIdx]) {
            $modIdx = min((int) $modIdx, $moduleIds->count() - 1);
            Seance::create([
                'user_id' => $user->id,
                'module_id' => $moduleIds[$modIdx],
                'groupe_id' => $groupe->id,
                'filiere_id' => $filiere->id,
                'date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'salle' => $rooms[$modIdx % count($rooms)],
                'status' => 'planifie',
                'type' => 'presentiel',
            ]);
        }

        $attendanceYear = "{$academicYear->year_start}-{$academicYear->year_end}";
        $absenceStudents = $linked->take(3);
        $absenceDate = $startOfWeek->copy()->subDays(2)->toDateString();
        $absenceRows = [];
        foreach ($absenceStudents as $index => $stagiaire) {
            $absenceRows[] = [
                'student_id' => $stagiaire->user_id,
                'module_id' => $moduleIds[$index % $moduleIds->count()],
                'group_id' => $groupe->id,
                'date' => $absenceDate,
                'academic_year' => $attendanceYear,
                'teacher_id' => $user->id,
                'status' => 'absent',
                'created_by' => $user->id,
                'updated_at' => now(),
                'created_at' => now(),
            ];
        }
        if (! empty($absenceRows)) {
            DB::table('attendances')->upsert(
                $absenceRows,
                ['student_id', 'module_id', 'group_id', 'date', 'academic_year'],
                ['teacher_id', 'status', 'created_by', 'updated_at']
            );
        }

        // Keep non-simulated teachers consistent: each assigned module gets at least one weekly slot.
        $this->ensureAssignedWeeklySeancesExist();

        $this->command?->info('Formateur simulation ready: 1 filiere, 3 modules, weekly schedule, 10+ stagiaires.');
    }
}
