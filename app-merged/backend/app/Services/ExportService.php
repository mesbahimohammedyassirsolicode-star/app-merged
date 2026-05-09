<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    public function studentsCsv(): StreamedResponse
    {
        $rows = Stagiaire::query()
            ->with(['user:id,name,email', 'groupe:id,label', 'filiere:id,code,label'])
            ->get();

        return $this->streamCsv('students.csv', ['ID', 'Name', 'Email', 'Group', 'Filiere'], function () use ($rows) {
            foreach ($rows as $row) {
                yield [
                    $row->id,
                    $row->user?->name,
                    $row->user?->email,
                    $row->groupe?->label,
                    $row->filiere?->label,
                ];
            }
        });
    }

    public function modulesCsv(): StreamedResponse
    {
        $rows = Module::query()->with('filiere:id,label')->get();

        return $this->streamCsv('modules.csv', ['ID', 'Code', 'Label', 'Semester', 'Coefficient', 'Filiere'], function () use ($rows) {
            foreach ($rows as $row) {
                yield [$row->id, $row->code, $row->label, $row->semester, $row->coefficient, $row->filiere?->label];
            }
        });
    }

    public function gradesCsv(): StreamedResponse
    {
        $rows = DB::table('notes')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->join('users', 'users.id', '=', 'stagiaires.user_id')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('modules', 'modules.id', '=', 'evaluations.module_id')
            ->join('groupes', 'groupes.id', '=', 'evaluations.groupe_id')
            ->select('notes.id', 'users.name as student_name', 'modules.label as module_label', 'groupes.label as group_label', 'notes.valeur', 'evaluations.max_points')
            ->orderBy('notes.id')
            ->get();

        return $this->streamCsv('grades.csv', ['ID', 'Student', 'Module', 'Group', 'Grade', 'Scale'], function () use ($rows) {
            foreach ($rows as $row) {
                yield [$row->id, $row->student_name, $row->module_label, $row->group_label, $row->valeur, $row->max_points];
            }
        });
    }

    private function streamCsv(string $filename, array $headers, callable $rowsFactory): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rowsFactory) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rowsFactory() as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }
}
