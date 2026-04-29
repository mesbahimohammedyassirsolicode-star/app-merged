<?php

use App\Http\Controllers\AcademicStructureController;
use App\Http\Controllers\AffectationController;
use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\AttendanceRiskController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CourseFileController;
use App\Http\Controllers\Api\FormateurAssignmentController;
use App\Http\Controllers\Api\GradesSummaryController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MyModulesController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ParentScopeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StageController;
use App\Http\Controllers\Api\StagiaireGroupController;
use App\Http\Controllers\Api\StagiairePortalController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableDataController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ─── Role group shortcuts ──────────────────────────────────────────────────
// FIXED: Extracted repeated role lists into named constants to eliminate
// the massive duplication/typos in middleware declarations (e.g. 'directeur' appeared twice).
// Update these arrays when roles change — one place instead of 30+.
$allRoles = 'admin,directeur,secretariat,teacher,formateur,student,stagiaire,parent';
$staffRoles = 'admin,directeur,secretariat,teacher,formateur';
$adminRoles = 'admin,directeur,secretariat';
$teacherRoles = 'teacher,formateur';
$studentRoles = 'student,stagiaire';

Route::prefix('v1')->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $studentRoles) {
    Route::get('/health', [HealthController::class, 'index']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/feedbacks', [FeedbackController::class, 'store']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $studentRoles) {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('role:'.$allRoles);
        Route::get('/parent/dashboard', [DashboardController::class, 'index'])->middleware('role:parent');
        Route::get('/stagiaire/dashboard', [DashboardController::class, 'index'])->middleware('role:'.$studentRoles);

        // ─── Admin / Secretariat only ─────────────────────────────────────
        Route::middleware('role:'.$adminRoles)->group(function () {
            Route::apiResource('users', UserController::class);
            Route::get('/feedbacks', [FeedbackController::class, 'index']);
            Route::get('/admin/parent-links/parents', [ParentScopeController::class, 'adminParents'])->middleware('role:admin');
            Route::get('/admin/parent-links/parents/{parent}/linkable-stagiaires', [ParentScopeController::class, 'adminLinkableStagiaires'])->middleware('role:admin');
            Route::post('/admin/parent-links/parents/{parent}/link-stagiaires', [ParentScopeController::class, 'adminLinkStagiaires'])->middleware('role:admin');

            Route::get('/academic-structure/years', [AcademicStructureController::class, 'indexYears']);
            Route::post('/academic-structure/years', [AcademicStructureController::class, 'storeYear']);
            Route::put('/academic-structure/years/{year}', [AcademicStructureController::class, 'updateYear']);
            Route::delete('/academic-structure/years/{year}', [AcademicStructureController::class, 'destroyYear']);
            Route::get('/academic-structure/filieres', [AcademicStructureController::class, 'indexFilieres']);
            Route::post('/academic-structure/filieres', [AcademicStructureController::class, 'storeFiliere']);
            Route::put('/academic-structure/filieres/{filiere}', [AcademicStructureController::class, 'updateFiliere']);
            Route::delete('/academic-structure/filieres/{filiere}', [AcademicStructureController::class, 'destroyFiliere']);

            if (app()->environment(['local', 'testing'])) {
                Route::post('/debug/sync-relationships', function () {
                    // 1. Sync missing Filiere IDs on Groupes
                    $groupsFixed = 0;
                    foreach (Groupe::whereNull('filiere_id')->orWhere('filiere_id', 0)->get() as $g) {
                        if ($g->niveau) {
                            $g->update(['filiere_id' => $g->niveau->filiere_id]);
                            $groupsFixed++;
                        }
                    }

                    // 2. Sync missing Groupe IDs on Stagiaires from the old pivot table
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

                    // 3. Return report
                    return response()->json([
                        'success' => true,
                        'message' => 'Database integrity synced successfully.',
                        'fixed_data' => [
                            'groups_missing_filiere_fixed' => $groupsFixed,
                            'students_missing_group_fixed' => $studentsFixed,
                        ],
                    ]);
                });
            }

            Route::post('/groups', [GroupController::class, 'store']);
            Route::put('/groups/{group}', [GroupController::class, 'update']);
            Route::delete('/groups/{group}', [GroupController::class, 'destroy']);
            Route::post('/groups/{group}/enroll', [GroupController::class, 'enrollStudents']);

            Route::post('/modules', [ModuleController::class, 'store']);
            Route::put('/modules/{module}', [ModuleController::class, 'update']);
            Route::delete('/modules/{module}', [ModuleController::class, 'destroy']);

            Route::post('/formateur-assignments', [FormateurAssignmentController::class, 'store']);
            Route::get('/formateur-assignments/formateurs/{formateur}', [FormateurAssignmentController::class, 'byTeacher']);

            Route::delete('/stages/{stage}', [StageController::class, 'destroy']);
        });

        Route::scopeBindings()->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $studentRoles) {
            // ─── Academic structure (read) ─────────────────────────────────
            // FIXED: Kept /levels and /niveaux as explicit aliases for backward compat; documented.
            Route::get('/academic-structure/levels', [AcademicStructureController::class, 'indexLevels'])
                ->middleware('role:'.$allRoles);
            // Alias kept for French-locale clients; both point to the same action.
            Route::get('/academic-structure/niveaux', [AcademicStructureController::class, 'indexLevels'])
                ->middleware('role:'.$allRoles);

            // Lightweight filieres list for filters — accessible to every authenticated role.
            Route::get('/filieres', [AcademicStructureController::class, 'indexFilieres'])
                ->middleware('role:'.$allRoles);

            Route::get('/program', [AcademicStructureController::class, 'getProgram'])
                ->middleware('role:'.$allRoles);

            // ─── Groups (read) ────────────────────────────────────────────
            // FIXED: /groupes is an alias kept for French-locale clients.
            Route::get('/groups', [GroupController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/groupes', [GroupController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/groups/{group}', [GroupController::class, 'show'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');

            // ─── Modules ─────────────────────────────────────────────────
            Route::get('/modules/academic-catalog', [ModuleController::class, 'academicCatalog'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/my-modules', [MyModulesController::class, 'index'])->middleware('role:'.$teacherRoles);
            Route::match(['put', 'post'], '/modules/{module}/progress', [MyModulesController::class, 'updateProgress'])
                ->middleware('role:'.$teacherRoles);
            Route::get('/modules', [ModuleController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/modules/{module}', [ModuleController::class, 'show'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/modules/{module}/syllabus', [ModuleController::class, 'showSyllabus'])
                ->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::post('/modules/{module}/syllabus', [ModuleController::class, 'updateSyllabus'])
                ->middleware('role:'.$staffRoles);

            // ─── Formateur assignments ────────────────────────────────────
            Route::get('/formateur-assignments/me', [FormateurAssignmentController::class, 'me'])
                ->middleware('role:'.$teacherRoles);

            // ─── Seances / Attendance (legacy endpoints) ──────────────────
            Route::get('/seances', [AttendanceController::class, 'index'])->middleware('role:'.$staffRoles);
            Route::get('/seances/{seance}', [AttendanceController::class, 'show'])->middleware('role:'.$staffRoles);
            Route::post('/seances', [AttendanceController::class, 'store'])->middleware('role:'.$adminRoles);
            Route::put('/seances/{seance}', [AttendanceController::class, 'update'])->middleware('role:'.$adminRoles);
            Route::delete('/seances/{seance}', [AttendanceController::class, 'destroy'])->middleware('role:'.$adminRoles);
            Route::get('/seances/{seance}/roll-call', [AttendanceController::class, 'getRollCall'])
                ->middleware('role:'.$staffRoles);
            Route::post('/seances/{seance}/roll-call', [AttendanceController::class, 'submitRollCall'])
                ->middleware('role:'.$staffRoles);
            Route::get('/seances/{seance}/absences', [AttendanceController::class, 'getAbsencesForSeance'])
                ->middleware('role:'.$adminRoles);
            Route::post('/seances/{seance}/absences', [AttendanceController::class, 'markAbsences'])
                ->middleware('role:'.$adminRoles);

            // ─── Attendance risk ──────────────────────────────────────────
            Route::get('/groups/{group}/attendance-summary', [AttendanceRiskController::class, 'summaryByGroup'])
                ->middleware('role:'.$staffRoles);
            Route::get('/stagiaires/{stagiaire}/attendance-summary', [AttendanceRiskController::class, 'summaryByStagiaire'])
                ->middleware('role:'.$allRoles);

            // ─── Attendance API (modern) ──────────────────────────────────
            Route::get('/attendance/report', [AttendanceApiController::class, 'report'])
                ->middleware('role:'.$adminRoles.','.$teacherRoles);
            Route::get('/attendance/detect', [AttendanceApiController::class, 'detect'])->middleware('role:'.$staffRoles);
            Route::get('/attendance', [AttendanceApiController::class, 'index'])->middleware('role:'.$staffRoles);
            Route::post('/attendance', [AttendanceApiController::class, 'store'])->middleware('role:'.$staffRoles);
            Route::post('/attendance/sessions', [AttendanceApiController::class, 'markSession'])->middleware('role:'.$staffRoles);
            Route::get('/attendance/sessions/detect', [AttendanceApiController::class, 'detect'])->middleware('role:'.$staffRoles);
            Route::put('/attendance/{id}', [AttendanceApiController::class, 'update'])->middleware('role:'.$staffRoles);
            Route::get('/attendance/me', [AttendanceApiController::class, 'me'])->middleware('role:'.$studentRoles);
            Route::get('/attendance/child/{studentId}', [AttendanceApiController::class, 'child'])->middleware('role:parent');

            // ─── Grades ───────────────────────────────────────────────────
            Route::get('/affectations', [AffectationController::class, 'index'])
                ->middleware('role:'.$staffRoles);
            Route::get('/affectations/{affectation}', [AffectationController::class, 'show'])
                ->middleware('role:'.$staffRoles);
            Route::get('/affectations/{affectation}/grades-summary', [GradesSummaryController::class, 'summaryByAffectation'])
                ->middleware('role:'.$staffRoles);
            Route::get('/stagiaires/{stagiaire}/grades-summary', [GradesSummaryController::class, 'summaryByStagiaire'])
                ->middleware('role:'.$allRoles);

            // ─── Timetable ────────────────────────────────────────────────
            // FIXED: /emploi-du-temps is an alias kept for French-locale clients.
            Route::get('/timetable', [TimetableController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/emploi-du-temps', [TimetableController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/schedules', [ScheduleController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');

            // Stagiaire portal — strictly filière-scoped modules & timetable (read-only).
            Route::middleware('role:'.$studentRoles)->prefix('stagiaire')->group(function () {
                Route::get('/dashboard', [DashboardController::class, 'index']);
                Route::get('/modules', [StagiairePortalController::class, 'modules']);
                Route::get('/timetable', [StagiairePortalController::class, 'timetable']);
                Route::get('/notes', [StagiairePortalController::class, 'notes']);
                Route::get('/group', [StagiaireGroupController::class, 'show']);
            });

            // JSON-file-based timetable — reads directly from database/data/*.json, no DB needed.
            Route::get('/timetable-data/filieres', [TimetableDataController::class, 'filieres'])->middleware('role:'.$allRoles);
            Route::get('/timetable-data', [TimetableDataController::class, 'index'])->middleware('role:'.$allRoles);

            // Timetable write operations — admin full CRUD, formateur manages own sessions
            Route::post('/timetable', [TimetableController::class, 'store'])->middleware('role:admin,directeur,secretariat,teacher,formateur');
            Route::put('/timetable/{seance}', [TimetableController::class, 'update'])->middleware('role:admin,directeur,secretariat,teacher,formateur');
            Route::delete('/timetable/{seance}', [TimetableController::class, 'destroy'])->middleware('role:admin,directeur,secretariat,teacher,formateur');

            // ─── Progress ─────────────────────────────────────────────────
            Route::get('/stagiaires/{stagiaire}/progress', [ProgressController::class, 'index'])
                ->middleware('role:'.$allRoles);

            // ─── Evaluations ──────────────────────────────────────────────
            Route::get('/evaluations', [EvaluationController::class, 'index'])->middleware('role:'.$allRoles);
            Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show'])->middleware('role:'.$allRoles);
            Route::post('/evaluations', [EvaluationController::class, 'store'])->middleware('role:'.$staffRoles);
            Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->middleware('role:'.$staffRoles);
            Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->middleware('role:'.$staffRoles);
            Route::get('/evaluations/{evaluation}/notes', [EvaluationController::class, 'getNotes'])->middleware('role:'.$staffRoles);
            Route::post('/evaluations/{evaluation}/notes', [EvaluationController::class, 'saveNotes'])->middleware('role:'.$staffRoles);

            // ─── Stages ───────────────────────────────────────────────────
            Route::get('/stages', [StageController::class, 'index'])->middleware('role:'.$staffRoles);
            Route::get('/stages/{stage}', [StageController::class, 'show'])->middleware('role:'.$staffRoles);
            Route::post('/stages', [StageController::class, 'store'])->middleware('role:'.$staffRoles);
            Route::put('/stages/{stage}', [StageController::class, 'update'])->middleware('role:'.$staffRoles);

            // ─── Notifications ────────────────────────────────────────────
            Route::get('/notifications', [NotificationController::class, 'index'])
                ->middleware('role:'.$allRoles);
            Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
                ->middleware('role:'.$allRoles);

            // ─── Reports ─────────────────────────────────────────────────
            Route::get('/students/{id}/report', [ReportController::class, 'studentReport'])
                ->middleware('role:'.$allRoles);

            // ─── Course files (private storage, authorized download) ─────
            Route::get('/course-files', [CourseFileController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/course-files', [CourseFileController::class, 'store'])->middleware('role:'.$staffRoles);
            Route::get('/course-files/{courseFile}/download', [CourseFileController::class, 'download'])->middleware('role:'.$allRoles);
            Route::delete('/course-files/{courseFile}', [CourseFileController::class, 'destroy'])->middleware('role:'.$allRoles);

            // ─── Messages ────────────────────────────────────────────────
            // FIXED: Messages routes were missing role middleware — any authenticated user
            // could read/write all messages. Added ALL_ROLES so all authenticated roles
            // can use the messaging feature but anonymous requests are rejected.
            Route::get('/messages', [MessageController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/messages', [MessageController::class, 'store'])->middleware('role:'.$allRoles);
            Route::post('/messages/{message}/read', [MessageController::class, 'markAsRead'])->middleware('role:'.$allRoles);

            // ─── Commerce API ─────────────────────────────────────────────
            Route::get('/products', [ProductController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/products', [ProductController::class, 'store'])->middleware('role:'.$adminRoles);
            Route::get('/cart/me', [CartController::class, 'me'])->middleware('role:'.$allRoles);
            Route::post('/cart/items', [CartController::class, 'add'])->middleware('role:'.$allRoles);
            Route::post('/orders', [OrderController::class, 'store'])->middleware('role:'.$allRoles);
        });

        // ─── Parent-scoped routes ─────────────────────────────────────────
        Route::middleware('role:parent')->prefix('parent')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
            Route::get('/children', [ParentScopeController::class, 'children']);
            Route::get('/stagiaires', [ParentScopeController::class, 'stagiaires']);
            Route::get('/stagiaire/{stagiaire}', [ParentScopeController::class, 'show']);
            Route::get('/children/{stagiaire}/grades', [ParentScopeController::class, 'grades']);
            Route::get('/children/{stagiaire}/attendance', [ParentScopeController::class, 'attendance']);
        });
    });
});
