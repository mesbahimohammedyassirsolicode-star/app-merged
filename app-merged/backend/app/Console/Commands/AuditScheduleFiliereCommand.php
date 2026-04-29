<?php

namespace App\Console\Commands;

use App\Models\Seance;
use App\Models\Stagiaire;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditScheduleFiliereCommand extends Command
{
    protected $signature = 'schedules:audit-filiere
                            {--sample=8 : How many example IDs to show per issue category}';

    protected $description = 'Audit seances and stagiaires for filière data used by timetable filtering';

    public function handle(): int
    {
        if (! Schema::hasTable('seances')) {
            $this->error('Table `seances` does not exist.');

            return self::FAILURE;
        }

        $sample = max(0, (int) $this->option('sample'));

        $this->info('=== Timetable / filière audit ===');
        $this->newLine();

        $this->auditSeances($sample);
        $this->newLine();
        $this->auditStagiaires($sample);
        $this->newLine();
        $this->line('Tip: run <fg=cyan>php artisan migrate</> to apply the backfill migration <fg=gray>2026_04_18_200000_backfill_seances_filiere_id</> if counts are high.');
        $this->newLine();

        return self::SUCCESS;
    }

    private function auditSeances(int $sample): void
    {
        $this->components->twoColumnDetail('<fg=white>Seances (non-deleted)</>', (string) Seance::query()->count());

        $missingAny = Seance::query()->whereNull('filiere_id')->count();
        $this->components->twoColumnDetail('  filiere_id IS NULL', (string) $missingAny);

        if (Schema::hasColumn('seances', 'groupe_id')) {
            $missingButHasGroup = Seance::query()
                ->whereNull('filiere_id')
                ->whereNotNull('groupe_id')
                ->count();
            $this->components->twoColumnDetail('  … and groupe_id set (backfill candidate)', (string) $missingButHasGroup);
            if ($sample > 0 && $missingButHasGroup > 0) {
                $ids = Seance::query()
                    ->whereNull('filiere_id')
                    ->whereNotNull('groupe_id')
                    ->orderBy('id')
                    ->limit($sample)
                    ->pluck('id');
                $this->line('    sample seance ids: '.$ids->implode(', '));
            }
        }

        if (
            Schema::hasTable('groupes')
            && Schema::hasColumn('groupes', 'filiere_id')
            && Schema::hasColumn('seances', 'groupe_id')
        ) {
            $mismatch = DB::table('seances as s')
                ->join('groupes as g', 'g.id', '=', 's.groupe_id')
                ->whereNull('s.deleted_at')
                ->whereNotNull('s.filiere_id')
                ->whereNotNull('g.filiere_id')
                ->whereColumn('s.filiere_id', '!=', 'g.filiere_id')
                ->count();
            $this->components->twoColumnDetail('  seance.filiere_id ≠ groupe.filiere_id', (string) $mismatch);
            if ($sample > 0 && $mismatch > 0) {
                $rows = DB::table('seances as s')
                    ->join('groupes as g', 'g.id', '=', 's.groupe_id')
                    ->whereNull('s.deleted_at')
                    ->whereNotNull('s.filiere_id')
                    ->whereNotNull('g.filiere_id')
                    ->whereColumn('s.filiere_id', '!=', 'g.filiere_id')
                    ->orderBy('s.id')
                    ->limit($sample)
                    ->get(['s.id', 's.filiere_id', 'g.filiere_id as groupe_filiere_id']);
                foreach ($rows as $r) {
                    $this->line("    seance {$r->id}: seance.filiere_id={$r->filiere_id} groupe.filiere_id={$r->groupe_filiere_id}");
                }
            }
        }

        if (Schema::hasColumn('seances', 'module_id') && Schema::hasTable('modules') && Schema::hasColumn('modules', 'filiere_id')) {
            $missingButHasModule = Seance::query()
                ->whereNull('filiere_id')
                ->whereNotNull('module_id')
                ->count();
            $this->components->twoColumnDetail('  filiere_id NULL but module_id set', (string) $missingButHasModule);
        }
    }

    private function auditStagiaires(int $sample): void
    {
        if (! Schema::hasTable('stagiaires')) {
            $this->warn('Table `stagiaires` does not exist — skip stagiaire checks.');

            return;
        }

        $this->components->twoColumnDetail('<fg=white>Stagiaires (non-deleted)</>', (string) Stagiaire::query()->count());

        $noFiliere = Stagiaire::query()->whereNull('filiere_id')->count();
        $this->components->twoColumnDetail('  filiere_id IS NULL', (string) $noFiliere);

        if (Schema::hasColumn('stagiaires', 'groupe_id')) {
            $noFiliereButGroup = Stagiaire::query()
                ->whereNull('filiere_id')
                ->whereNotNull('groupe_id')
                ->count();
            $this->components->twoColumnDetail('  … but groupe_id set (resolve from groupe / niveau)', (string) $noFiliereButGroup);
        }

        $noFiliereNoGroup = Stagiaire::query()
            ->whereNull('filiere_id')
            ->when(Schema::hasColumn('stagiaires', 'groupe_id'), fn ($q) => $q->whereNull('groupe_id'))
            ->count();
        $this->components->twoColumnDetail('  filiere_id NULL and groupe_id NULL', (string) $noFiliereNoGroup);

        if (Schema::hasTable('groupe_stagiaire')) {
            $onlyPivot = Stagiaire::query()
                ->whereNull('filiere_id')
                ->when(Schema::hasColumn('stagiaires', 'groupe_id'), fn ($q) => $q->whereNull('groupe_id'))
                ->has('groupes')
                ->count();
            $this->components->twoColumnDetail('  only via groupe_stagiaire (no filiere_id / groupe_id on stagiaire)', (string) $onlyPivot);
        }

        if ($sample > 0 && $noFiliere > 0) {
            $ids = Stagiaire::query()
                ->whereNull('filiere_id')
                ->orderBy('id')
                ->limit($sample)
                ->pluck('id');
            $this->line('  sample stagiaire ids: '.$ids->implode(', '));
        }
    }
}
