<?php

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'check.role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\EnsurePermission::class,
        ]);
        $middleware->api(append: [\App\Http\Middleware\SecurityHeaders::class]);
        // API: never redirect to login; return 401 JSON instead (handled by renderable below)
        Authenticate::redirectUsing(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }
            return \Illuminate\Support\Facades\Route::has('login') ? route('login') : null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifie.',
                    'errors' => (object) [],
                ], Response::HTTP_UNAUTHORIZED);
            }
        });

        $exceptions->renderable(function (ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $e->errors(),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        });

        $exceptions->renderable(function (ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                    'errors' => (object) [],
                ], Response::HTTP_NOT_FOUND);
            }
        });

        $exceptions->renderable(function (AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() !== '' ? $e->getMessage() : 'Forbidden.',
                    'errors' => (object) [],
                ], Response::HTTP_FORBIDDEN);
            }
        });

        $exceptions->renderable(function (HttpExceptionInterface $e, $request) {
            if ($request->is('api/*')) {
                $status = $e->getStatusCode();
                $defaultMessage = match ($status) {
                    Response::HTTP_FORBIDDEN => 'Forbidden.',
                    Response::HTTP_NOT_FOUND => 'Resource not found.',
                    Response::HTTP_UNAUTHORIZED => 'Unauthenticated.',
                    default => 'Request failed.',
                };

                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() !== '' ? $e->getMessage() : $defaultMessage,
                    'errors' => (object) [],
                ], $status);
            }
        });

        $exceptions->renderable(function (\Throwable $e, $request) {
            if ($request->is('api/*') && ! ($e instanceof HttpResponseException)) {
                report($e);

                return response()->json([
                    'success' => false,
                    'message' => 'Server error.',
                    'errors' => (object) [],
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        });
    })->create();
