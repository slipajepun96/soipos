<?php

use App\Support\ErrorDescriber;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Inertia / axios requests get a JSON message with the specific reason,
        // which the frontend shows as a toast (instead of a generic "error 500").
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($e instanceof ValidationException || $e instanceof AuthenticationException) {
                return null; // handled normally (field errors / redirect to login)
            }
            if (! $request->header('X-Inertia') && ! $request->expectsJson()) {
                return null;
            }
            [$status, $message] = ErrorDescriber::describe($e, (bool) $request->user());

            return response()->json(['message' => $message], $status);
        });
    })->create();
