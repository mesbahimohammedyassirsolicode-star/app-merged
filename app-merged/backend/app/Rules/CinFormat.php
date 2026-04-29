<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Moroccan CIN format: 2 letters + 6 digits (e.g. AB123456, CD789012).
 */
class CinFormat implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $trimmed = is_string($value) ? trim($value) : '';
        if ($trimmed === '') {
            return;
        }
        if (! preg_match('/^[A-Z]{2}\d{6}$/i', $trimmed)) {
            $fail(__('Le CIN doit être au format 2 lettres + 6 chiffres (ex: AB123456).'));
        }
    }
}
