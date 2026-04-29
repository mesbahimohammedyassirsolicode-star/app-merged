<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

/**
 * FIXED: Standardized all response methods to include a top-level 'success' boolean.
 * All controllers inheriting from App\Http\Controllers\Controller get this automatically.
 *
 * Standard shapes:
 *   Success: { "success": true,  "data": {}, "message": "...", "meta": {} }
 *   Error:   { "success": false, "message": "...", "errors": {} }
 */
trait ApiResponse
{
    protected function success(mixed $data = null, array $meta = [], string $message = ''): JsonResponse
    {
        $body = [
            'success' => true,
            'message' => $message !== '' ? $message : 'Operation successful',
        ];
        if ($data !== null) {
            $body['data'] = $data;
        }
        if (! empty($meta)) {
            $body['meta'] = $meta;
        }
        return response()->json($body);
    }

    protected function created(mixed $data = null, string $message = ''): JsonResponse
    {
        $body = [
            'success' => true,
            'message' => $message !== '' ? $message : 'Operation successful',
        ];
        if ($data !== null) {
            $body['data'] = $data;
        }
        return response()->json($body, 201);
    }

    protected function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $body = [
            'success' => false,
            'message' => $message,
            'errors' => (object) $errors,
        ];
        return response()->json($body, $status);
    }

    protected function validationErrors(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed.',
            'errors'  => $errors,
        ], 422);
    }
}
