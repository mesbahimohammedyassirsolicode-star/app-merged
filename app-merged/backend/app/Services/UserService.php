<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function createUser(array $data, string $normalizedRole, bool $isTeacher, bool $isStudent, bool $isAdmin, bool $isParent): User
    {
        return DB::transaction(function () use ($data, $normalizedRole, $isStudent, $isTeacher, $isAdmin, $isParent) {
            $createdUser = User::create([
                'name' => $data['name'],
                'email' => strtolower(trim((string) $data['email'])),
                'password' => $data['password'],
                'role' => $normalizedRole,
                'avatar_url' => $data['avatar_url'] ?? null,
                'is_active' => true,
            ]);

            if ($isStudent) {
                $stagiaire = $createdUser->stagiaire()->create([
                    'filiere_id' => $data['filiere_id'] ?? null,
                    'groupe_id' => $data['groupe_id'] ?? null,
                    'cin' => strtoupper(trim($data['cin'] ?? '')),
                    'cef_number' => $data['cef_number'] ?? null,
                    'date_naissance' => $data['date_naissance'] ?? null,
                    'niveau_scolaire' => $data['niveau_scolaire'] ?? null,
                    'niveau_formation' => $data['niveau_formation'] ?? null,
                    'status' => $data['status'] ?? 'actif',
                ]);
                if (! empty($data['groupe_id'])) {
                    $stagiaire->groupes()->syncWithoutDetaching([$data['groupe_id']]);
                }
            }

            if ($isTeacher) {
                $createdUser->formateur()->create([
                    'matricule' => $data['matricule'],
                    'specialty' => $data['specialite'],
                    'type' => $data['type'] ?? 'permanent',
                    'hourly_rate' => $data['hourly_rate'] ?? null,
                    'filiere_id' => $data['filiere_id_formateur'] ?? null,
                    'niveau' => $data['niveau_formateur'] ?? null,
                ]);

                if (! empty($data['modules'])) {
                    $createdUser->modules()->sync($data['modules']);
                }
                if (! empty($data['groups'])) {
                    $createdUser->groups()->sync($data['groups']);
                }

                if (! empty($data['modules']) && ! empty($data['groups'])) {
                    $assignments = [];
                    foreach ($data['modules'] as $mId) {
                        foreach ($data['groups'] as $gId) {
                            $assignments[] = [
                                'user_id' => $createdUser->id,
                                'module_id' => $mId,
                                'groupe_id' => $gId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    DB::table('formateur_module_group')->insert($assignments);
                }
            }

            if ($isAdmin) {
                $createdUser->administrator()->create([
                    'poste' => $data['poste'] ?? 'Administrateur',
                    'phone' => $data['phone'] ?? null,
                ]);
            }

            if ($isParent) {
                $createdUser->parent()->create([
                    'cin' => strtoupper(trim($data['cin'])),
                    'phone' => $data['phone'],
                    'address' => $data['address'] ?? null,
                ]);
            }

            return $createdUser->load([
                'stagiaire.filiere',
                'stagiaire.groupe',
                'formateur',
                'administrator',
                'parent',
                'modules:id,code,label',
                'groups:id,label',
            ]);
        });
    }

    public function updateUser(User $user, array $validatedData): User
    {
        DB::transaction(function () use ($user, $validatedData) {
            $userFields = array_intersect_key($validatedData, array_flip([
                'name', 'email', 'password', 'is_active', 'avatar_url',
            ]));
            if (! empty($userFields)) {
                if (array_key_exists('email', $userFields)) {
                    $userFields['email'] = strtolower(trim((string) $userFields['email']));
                }
                $user->update($userFields);
            }

            if (in_array($user->role, ['teacher', 'formateur'], true)) {
                $formateurData = array_intersect_key($validatedData, array_flip([
                    'matricule',
                    'specialty',
                    'type',
                    'hourly_rate',
                ]));

                if (isset($validatedData['specialite']) && ! isset($formateurData['specialty'])) {
                    $formateurData['specialty'] = $validatedData['specialite'];
                }
                if (array_key_exists('filiere_id_formateur', $validatedData)) {
                    $rawF = $validatedData['filiere_id_formateur'];
                    $formateurData['filiere_id'] = ($rawF === null || $rawF === '' || (int) $rawF === 0)
                        ? null
                        : (int) $rawF;
                }
                if (array_key_exists('niveau_formateur', $validatedData)) {
                    $nv = $validatedData['niveau_formateur'];
                    $formateurData['niveau'] = ($nv === null || $nv === '') ? null : (string) $nv;
                }

                if ($user->formateur) {
                    $user->formateur()->update($formateurData);
                } else {
                    $user->formateur()->create(array_merge(
                        [
                            'matricule' => $validatedData['matricule'] ?? ('USR-'.$user->id),
                            'specialty' => $validatedData['specialty'] ?? $validatedData['specialite'] ?? 'Non renseigne',
                            'type' => $validatedData['type'] ?? 'permanent',
                            'hourly_rate' => $validatedData['hourly_rate'] ?? null,
                            'filiere_id' => null,
                            'niveau' => null,
                        ],
                        $formateurData
                    ));
                }

                if (isset($validatedData['modules'])) {
                    $user->modules()->sync($validatedData['modules']);
                }
                if (isset($validatedData['groups'])) {
                    $user->groups()->sync($validatedData['groups']);
                }

                if (isset($validatedData['modules']) && isset($validatedData['groups'])) {
                    DB::table('formateur_module_group')->where('user_id', $user->id)->delete();
                    $assignments = [];
                    foreach ($validatedData['modules'] as $mId) {
                        foreach ($validatedData['groups'] as $gId) {
                            $assignments[] = [
                                'user_id' => $user->id,
                                'module_id' => $mId,
                                'groupe_id' => $gId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    if (! empty($assignments)) {
                        DB::table('formateur_module_group')->insert($assignments);
                    }
                }
            } elseif (in_array($user->role, ['student', 'stagiaire']) && $user->stagiaire) {
                $stagiaireData = array_intersect_key($validatedData, array_flip(['cef_number', 'date_naissance', 'niveau_scolaire', 'niveau_formation', 'filiere_id', 'groupe_id', 'status', 'cin']));
                if (isset($validatedData['type_formation'])) {
                    $stagiaireData['niveau_formation'] = $validatedData['type_formation'];
                }
                if (isset($validatedData['filiere_id'])) {
                    $stagiaireData['filiere_id'] = (int) $validatedData['filiere_id'];
                }
                if (isset($validatedData['groupe_id'])) {
                    $gid = (int) $validatedData['groupe_id'];
                    $user->stagiaire->groupes()->syncWithoutDetaching([$gid]);
                    $stagiaireData['groupe_id'] = $gid;
                }
                if (isset($validatedData['cin'])) {
                    $stagiaireData['cin'] = strtoupper(trim($validatedData['cin']));
                }
                $user->stagiaire()->update($stagiaireData);
            } elseif ($user->role === 'parent' && $user->parent) {
                $parentData = array_intersect_key($validatedData, array_flip(['cin', 'phone', 'address']));
                if (array_key_exists('cin', $parentData)) {
                    $parentData['cin'] = strtoupper(trim((string) $parentData['cin']));
                }
                $user->parent()->update($parentData);
            } elseif (in_array($user->role, ['admin', 'directeur', 'secretariat']) && $user->administrator) {
                $user->administrator()->update(array_intersect_key($validatedData, array_flip(['poste', 'phone'])));
            }
        });

        return $user->load([
            'stagiaire' => fn ($q) => $q->with(['filiere:id,code,label', 'groupes:id,label,filiere_id']),
            'formateur',
            'administrator',
            'parent',
            'modules:id,code,label',
            'groups:id,label',
        ]);
    }
}
