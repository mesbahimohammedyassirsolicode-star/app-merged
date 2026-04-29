<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\CinFormat;
use App\Rules\OfpptEligibility;
use App\Rules\PasswordPolicy;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

    public function index(Request $request)
    {
        try {
            $query = User::query()
                ->with([
                    'stagiaire' => fn ($q) => $q->with(['filiere:id,code,label', 'groupes:id,label,filiere_id']),
                    'formateur',
                    'administrator',
                    'parent',
                    'modules:id,code,label',
                    'groups:id,label',
                ]);

            if ($request->filled('role')) {
                $query->where('role', $request->role);
            }

            return $this->success($query->latest()->paginate(20));
        } catch (Throwable $e) {
            Log::error('UserController::index failed', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur de chargement des utilisateurs.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $normalizedRole = strtolower(trim((string) $request->input('role', '')));
        $normalizedEmail = strtolower(trim((string) $request->input('email', '')));

        $request->merge([
            'role' => $normalizedRole,
            'email' => $normalizedEmail,
            'specialite' => trim((string) ($request->input('specialite') ?? $request->input('specialty') ?? '')),
        ]);

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'string', new PasswordPolicy],
            'role' => 'required|in:admin,teacher,student,parent,directeur,secretariat,formateur,stagiaire',
            'avatar_url' => 'nullable|string',
        ];

        $isTeacher = in_array($normalizedRole, ['teacher', 'formateur']);
        $isStudent = in_array($normalizedRole, ['student', 'stagiaire']);
        $isAdmin = in_array($normalizedRole, ['admin', 'directeur', 'secretariat']);
        $isParent = $normalizedRole === 'parent';

        if ($isTeacher) {
            $rules['matricule'] = 'required|string|max:50|unique:formateurs,matricule';
            $rules['specialite'] = 'required|string|max:100';
            $rules['type'] = 'nullable|in:permanent,vacataire';
            $rules['modules'] = 'nullable|array';
            $rules['groups'] = 'nullable|array';
        }

        if ($isStudent) {
            $rules['cin'] = ['required', 'string', new CinFormat, Rule::unique('stagiaires', 'cin')];
            $rules['cef_number'] = 'required|string|unique:stagiaires,cef_number';
            $rules['date_naissance'] = 'required|date';
            $rules['niveau_scolaire'] = ['nullable', 'in:COLLEGE,BAC,BAC+2,BAC+3,MASTER', new OfpptEligibility($request->input('niveau_formation'))];
            $rules['niveau_formation'] = 'nullable|in:Q,T,TS,BACHELOR,MASTER';
        }

        if ($isAdmin) {
            $rules['poste'] = 'nullable|string';
            $rules['phone'] = 'nullable|string';
        }

        if ($isParent) {
            $rules['cin'] = ['required', 'string', 'max:20', Rule::unique('parents', 'cin')];
            $rules['phone'] = 'required|string|max:20';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all(); // allow optional payload properties safely passed

        try {
            $user = $this->userService->createUser($data, $normalizedRole, $isTeacher, $isStudent, $isAdmin, $isParent);

            return response()->json(['success' => true, 'message' => 'User created successfully.', 'data' => $user], 201);
        } catch (QueryException $e) {
            if ($this->isDuplicateKeyException($e)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => [
                        'email' => ['This email has already been taken.'],
                    ],
                ], 422);
            }

            throw $e;
        } catch (Throwable $e) {
            Log::error('UserController::store failed', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => 'Failed to create user.', 'errors' => ['server' => [config('app.debug') ? $e->getMessage() : 'Server error.']]], 500);
        }
    }

    public function update(Request $request, User $user)
    {
        $request->merge([
            'email' => $request->has('email') ? strtolower(trim((string) $request->input('email'))) : $request->input('email'),
        ]);

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', new PasswordPolicy],
            'is_active' => 'sometimes|boolean',
        ];

        if (in_array($user->role, ['teacher', 'formateur'], true)) {
            $rules['matricule'] = ['sometimes', 'string', 'max:50', Rule::unique('formateurs', 'matricule')->ignore($user->formateur?->id)];
        }

        if (in_array($user->role, ['student', 'stagiaire'], true)) {
            $rules['cin'] = ['sometimes', 'string', new CinFormat, Rule::unique('stagiaires', 'cin')->ignore($user->stagiaire?->id)];
            $rules['cef_number'] = ['sometimes', 'string', Rule::unique('stagiaires', 'cef_number')->ignore($user->stagiaire?->id)];
        }

        if ($user->role === 'parent') {
            $rules['cin'] = ['sometimes', 'string', 'max:20', Rule::unique('parents', 'cin')->ignore($user->parent?->id)];
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all();

        try {
            $updatedUser = $this->userService->updateUser($user, $data);

            return $this->success($updatedUser);
        } catch (QueryException $e) {
            if ($this->isDuplicateKeyException($e)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => [
                        'email' => ['This email has already been taken.'],
                    ],
                ], 422);
            }

            throw $e;
        } catch (Throwable $e) {
            Log::error('UserController::update failed', ['user_id' => $user->id, 'message' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => config('app.debug') ? $e->getMessage() : 'Erreur lors de la mise à jour de l\'utilisateur.'], 500);
        }
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }

    private function isDuplicateKeyException(QueryException $exception): bool
    {
        $errorInfo = $exception->errorInfo ?? [];
        $sqlState = (string) ($errorInfo[0] ?? '');
        $driverCode = (int) ($errorInfo[1] ?? 0);

        // MySQL duplicate key = SQLSTATE 23000 + code 1062.
        return $sqlState === '23000' && $driverCode === 1062;
    }
}
