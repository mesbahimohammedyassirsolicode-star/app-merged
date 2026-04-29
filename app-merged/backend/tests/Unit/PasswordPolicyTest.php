<?php

namespace Tests\Unit;

use App\Rules\PasswordPolicy;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PasswordPolicyTest extends TestCase
{
    #[DataProvider('validPasswords')]
    public function test_accepts_valid_passwords(string $password): void
    {
        $validator = Validator::make(
            ['password' => $password],
            ['password' => ['required', new PasswordPolicy]]
        );

        $this->assertFalse($validator->fails());
    }

    public static function validPasswords(): array
    {
        return [
            'letters and numbers' => ['Secret123'],
            'min 8 chars' => ['Abcd1234'],
        ];
    }

    #[DataProvider('invalidPasswords')]
    public function test_rejects_invalid_passwords(string $password): void
    {
        $validator = Validator::make(
            ['password' => $password],
            ['password' => ['required', new PasswordPolicy]]
        );

        $this->assertTrue($validator->fails());
    }

    public static function invalidPasswords(): array
    {
        return [
            'too short' => ['Ab1'],
            'no number' => ['Password'],
            'no letter' => ['12345678'],
        ];
    }
}
