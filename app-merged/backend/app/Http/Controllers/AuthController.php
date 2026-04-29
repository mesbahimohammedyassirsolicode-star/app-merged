<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Exception;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        try {
            $result = $this->authService->login($credentials);

            if (! $result) {
                return $this->error('Les identifiants fournis sont incorrects.', 401);
            }

            // Using the UserResource to standardise output structure inside the data array
            $result['user'] = new UserResource($result['user']);

            return $this->success($result);
        } catch (Exception $e) {
            if ($e->getCode() === 403) {
                return $this->error($e->getMessage(), 403);
            }
            return $this->error('Erreur serveur lors de l\'authentification', 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        $data = $this->authService->getUserProfileData($request->user());
        $data['user'] = new UserResource($data['user']);
        
        return $this->success($data);
    }
}
