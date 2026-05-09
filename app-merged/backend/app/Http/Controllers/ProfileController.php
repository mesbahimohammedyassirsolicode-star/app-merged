<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfileService;

class ProfileController extends Controller
{
    public function __construct(private ProfileService $profileService) {}

    public function update(UpdateProfileRequest $request)
    {
        $user = $this->profileService->update($request->user(), $request->validated());

        return $this->success(new UserResource($user), [], 'Profile updated successfully.');
    }
}
