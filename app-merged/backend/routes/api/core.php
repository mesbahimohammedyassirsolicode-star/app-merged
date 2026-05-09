<?php

use App\Http\Controllers\AcademicStructureController;
use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\FormateurAssignmentController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MyModulesController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ParentScopeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StagiaireGroupController;
use App\Http\Controllers\Api\StagiairePortalController;
use App\Http\Controllers\Api\TrainerModuleController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Core API (non-auth/grades/students/stages/timetable/files)
 * Allowed roles: endpoint-specific role middleware
 * Auth requirements: mixed (public and sanctum-protected)
 */
Route::prefix('v1')->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $rbacAdminTrainerRoles, $rbacDashboardRoles, $aiAssistantRoles) {
    Route::get('/health', [HealthController::class, 'index']);
    Route::get('/health/trainer-assignments', [HealthController::class, 'trainerAssignments']);
    Route::post('/feedbacks', [FeedbackController::class, 'store']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $rbacAdminTrainerRoles, $rbacDashboardRoles, $aiAssistantRoles) {
        Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('role:'.$rbacDashboardRoles);
        Route::get('/parent/dashboard', [DashboardController::class, 'index'])->middleware('role:parent');
        Route::get('/stagiaire/dashboard', [DashboardController::class, 'index'])->middleware('role:student');

        Route::middleware('role:'.$adminRoles)->group(function () {
            Route::apiResource('users', UserController::class)->middleware('role:admin');
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
                    $groupsFixed = 0;
                    foreach (Groupe::whereNull('filiere_id')->orWhere('filiere_id', 0)->get() as $g) {
                        if ($g->niveau) {
                            $g->update(['filiere_id' => $g->niveau->filiere_id]);
                            $groupsFixed++;
                        }
                    }

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
        });

        Route::scopeBindings()->group(function () use ($allRoles, $staffRoles, $adminRoles, $teacherRoles, $rbacAdminTrainerRoles, $aiAssistantRoles) {
            Route::get('/academic-structure/levels', [AcademicStructureController::class, 'indexLevels'])->middleware('role:'.$allRoles);
            Route::get('/academic-structure/niveaux', [AcademicStructureController::class, 'indexLevels'])->middleware('role:'.$allRoles);
            Route::get('/filieres', [AcademicStructureController::class, 'indexFilieres'])->middleware('role:'.$allRoles);
            Route::get('/program', [AcademicStructureController::class, 'getProgram'])->middleware('role:'.$allRoles);

            Route::get('/groups', [GroupController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/groupes', [GroupController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/groups/{group}', [GroupController::class, 'show'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');

            Route::get('/modules/academic-catalog', [ModuleController::class, 'academicCatalog'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::get('/my-modules', [MyModulesController::class, 'index'])->middleware('role:'.$teacherRoles);
            Route::get('/trainer/modules', [TrainerModuleController::class, 'index'])->middleware('role:'.$teacherRoles);
            Route::match(['put', 'post'], '/modules/{module}/progress', [MyModulesController::class, 'updateProgress'])->middleware('role:'.$teacherRoles);
            Route::get('/modules', [ModuleController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire,parent');
            Route::get('/modules/{module}', [ModuleController::class, 'show'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire,parent');
            Route::get('/modules/{module}/syllabus', [ModuleController::class, 'showSyllabus'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
            Route::post('/modules/{module}/syllabus', [ModuleController::class, 'updateSyllabus'])->middleware('role:'.$rbacAdminTrainerRoles);

            Route::get('/formateur-assignments/me', [FormateurAssignmentController::class, 'me'])->middleware('role:'.$teacherRoles);

            Route::get('/seances', [AttendanceController::class, 'index'])->middleware('role:'.$staffRoles);
            Route::get('/seances/{seance}', [AttendanceController::class, 'show'])->middleware('role:'.$staffRoles);
            Route::post('/seances', [AttendanceController::class, 'store'])->middleware('role:'.$adminRoles);
            Route::put('/seances/{seance}', [AttendanceController::class, 'update'])->middleware('role:'.$adminRoles);
            Route::delete('/seances/{seance}', [AttendanceController::class, 'destroy'])->middleware('role:'.$adminRoles);
            Route::get('/seances/{seance}/roll-call', [AttendanceController::class, 'getRollCall'])->middleware('role:'.$staffRoles);
            Route::post('/seances/{seance}/roll-call', [AttendanceController::class, 'submitRollCall'])->middleware('role:'.$staffRoles);
            Route::get('/seances/{seance}/absences', [AttendanceController::class, 'getAbsencesForSeance'])->middleware('role:'.$adminRoles);
            Route::post('/seances/{seance}/absences', [AttendanceController::class, 'markAbsences'])->middleware('role:'.$adminRoles);

            Route::get('/attendance/report', [AttendanceApiController::class, 'report'])->middleware('role:'.$adminRoles.','.$teacherRoles);
            Route::get('/attendance/detect', [AttendanceApiController::class, 'detect'])->middleware('role:'.$staffRoles);
            Route::get('/attendance', [AttendanceApiController::class, 'index'])->middleware('role:'.$staffRoles);
            Route::post('/attendance', [AttendanceApiController::class, 'store'])->middleware('role:'.$staffRoles);
            Route::post('/attendance/sessions', [AttendanceApiController::class, 'markSession'])->middleware('role:'.$staffRoles);
            Route::get('/attendance/sessions/detect', [AttendanceApiController::class, 'detect'])->middleware('role:'.$staffRoles);
            Route::put('/attendance/{id}', [AttendanceApiController::class, 'update'])->middleware('role:'.$staffRoles);

            Route::middleware('role:student,stagiaire')->prefix('stagiaire')->group(function () {
                Route::get('/dashboard', [DashboardController::class, 'index']);
                Route::get('/modules', [StagiairePortalController::class, 'modules']);
                Route::get('/notes', [StagiairePortalController::class, 'notes']);
                Route::get('/group', [StagiaireGroupController::class, 'show']);
            });

            Route::get('/notifications', [NotificationController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->middleware('role:'.$allRoles);
            Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('role:'.$allRoles);

            Route::get('/analytics/overview', [AnalyticsController::class, 'overview'])->middleware('role:'.$allRoles);
            Route::post('/ai/assistant', [AiAssistantController::class, 'ask'])->middleware('role:'.$aiAssistantRoles);
            Route::post('/ai/export', [AiAssistantController::class, 'export'])->middleware('role:'.$aiAssistantRoles);

            Route::get('/messages', [MessageController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/messages', [MessageController::class, 'store'])->middleware('role:'.$allRoles);
            Route::post('/messages/{message}/read', [MessageController::class, 'markAsRead'])->middleware('role:'.$allRoles);
            Route::put('/profile', [ProfileController::class, 'update'])->middleware('role:'.$allRoles);

            Route::get('/exports/students', [ExportController::class, 'students'])->middleware('role:'.$staffRoles);
            Route::get('/exports/modules', [ExportController::class, 'modules'])->middleware('role:'.$staffRoles);
            Route::get('/exports/grades', [ExportController::class, 'grades'])->middleware('role:'.$staffRoles);

            Route::get('/products', [ProductController::class, 'index'])->middleware('role:'.$allRoles);
            Route::post('/products', [ProductController::class, 'store'])->middleware('role:'.$adminRoles);
            Route::get('/cart/me', [CartController::class, 'me'])->middleware('role:'.$allRoles);
            Route::post('/cart/items', [CartController::class, 'add'])->middleware('role:'.$allRoles);
            Route::post('/orders', [OrderController::class, 'store'])->middleware('role:'.$allRoles);
        });

        Route::middleware('role:parent')->prefix('parent')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
        });
    });
});
