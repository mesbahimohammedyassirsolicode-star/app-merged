<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileService
{
    public function update(User $user, array $validated): User
    {
        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        if (isset($validated['avatar']) && $validated['avatar'] instanceof UploadedFile) {
            $payload['avatar_url'] = $this->storeAvatar($validated['avatar'], $user);
        }

        $user->update($payload);

        return $user->fresh();
    }

    private function storeAvatar(UploadedFile $file, User $user): string
    {
        $path = $file->store('avatars', 'public');

        if (! empty($user->avatar_url)) {
            $oldPath = str_replace('/storage/', '', $user->avatar_url);
            if ($oldPath !== $path) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        return '/storage/'.$path;
    }
}
