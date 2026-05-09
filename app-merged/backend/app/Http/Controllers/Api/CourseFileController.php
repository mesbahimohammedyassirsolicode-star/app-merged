<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexCourseFileRequest;
use App\Http\Requests\StoreCourseFileRequest;
use App\Http\Resources\CourseFileResource;
use App\Models\CourseFile;
use App\Services\CourseFileService;
use Illuminate\Http\JsonResponse;

class CourseFileController extends Controller
{
    public function __construct(
        private CourseFileService $courseFileService
    ) {}

    public function index(IndexCourseFileRequest $request): JsonResponse
    {
        $this->authorize('viewAny', CourseFile::class);

        $query = $this->courseFileService->queryAccessibleFor($request->user());

        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', (int) $request->input('groupe_id'));
        }
        if ($request->filled('module_id')) {
            $moduleId = (int) $request->input('module_id');
            $this->courseFileService->assertTrainerCanScopeModule($request->user(), $moduleId);
            $query->where('module_id', $moduleId);
        }

        $perPage = (int) $request->input('per_page', 20);
        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return $this->success(
            CourseFileResource::collection($paginator->items())->resolve(),
            [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        );
    }

    public function store(StoreCourseFileRequest $request): JsonResponse
    {
        $this->authorize('create', CourseFile::class);

        $user = $request->user();
        $moduleId = (int) $request->input('module_id');

        $this->courseFileService->assertStaffCanAttach($user, null, $moduleId);

        $file = $this->courseFileService->store($user, $request->file('file'), [
            'groupe_id' => null,
            'module_id' => $moduleId,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
        ]);

        $file->load(['uploader:id,name,email', 'groupe:id,label,name', 'module:id,code,label,name']);

        return $this->created(CourseFileResource::make($file), 'Fichier enregistré.');
    }

    public function download(CourseFile $courseFile)
    {
        $this->authorize('view', $courseFile);

        return $this->courseFileService->downloadResponse($courseFile);
    }

    public function destroy(CourseFile $courseFile): JsonResponse
    {
        $this->authorize('delete', $courseFile);

        $this->courseFileService->deleteFile($courseFile);

        return $this->success(null, [], 'Fichier supprimé.');
    }
}
