<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * GIMS password policy: min 8 characters, mixed types (letter + number).
 */
class PasswordPolicy implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strlen($value) < 8) {
            $fail(__('Le mot de passe doit contenir au moins 8 caractères.'));

            return;
        }
        if (! preg_match('/[a-zA-Z]/', $value)) {
            $fail(__('Le mot de passe doit contenir au moins une lettre.'));

            return;
        }
        if (! preg_match('/[0-9]/', $value)) {
            $fail(__('Le mot de passe doit contenir au moins un chiffre.'));
        }
    }
}
