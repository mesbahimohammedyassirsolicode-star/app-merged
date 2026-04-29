<?php

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// Fix 1: Groups missing filiere_id
$groupsFixed = 0;
foreach (Groupe::whereNull('filiere_id')->orWhere('filiere_id', 0)->get() as $g) {
    if ($g->niveau && $g->niveau->filiere_id) {
        $g->update(['filiere_id' => $g->niveau->filiere_id]);
        $groupsFixed++;
    }
}
echo "Groups fixed: $groupsFixed\n";

// Fix 2: Stagiaire missing groupe_id
$studentsFixed = 0;
foreach (Stagiaire::whereNull('groupe_id')->orWhere('groupe_id', 0)->get() as $s) {
    $grp_id = DB::table('groupe_stagiaire')
        ->where('stagiaire_id', $s->id)
        ->orderByDesc('created_at')
        ->value('groupe_id');

    if ($grp_id) {
        $s->update(['groupe_id' => $grp_id]);
        $studentsFixed++;
    }
}
echo "Students fixed: $studentsFixed\n";

// Test the query output:
$filiere = Filiere::with(['groupes' => function ($q) {
    $q->withCount('students');
}])->first();

echo "Filiere Output:\n";
echo json_encode($filiere, JSON_PRETTY_PRINT);
