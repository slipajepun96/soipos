<?php

use App\Http\Middleware\EnsureMasterAdmin;
use App\Http\Middleware\EnsureStoreSelected;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveStore;
use App\Support\ErrorDescriber;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Production runs behind Cloudflare Tunnel -> nginx (cloudflared connects from localhost).
        // Trust its X-Forwarded-* headers so Laravel knows the visitor's real scheme (https), host and IP.
        $middleware->trustProxies(at: ['127.0.0.1', '::1']);

        $middleware->web(append: [
            ResolveStore::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // The store must be known before route model binding looks records up.
        $middleware->prependToPriorityList(
            before: SubstituteBindings::class,
            prepend: ResolveStore::class,
        );
        $middleware->prependToPriorityList(
            before: SubstituteBindings::class,
            prepend: EnsureStoreSelected::class,
        );

        $middleware->alias([
            'store' => EnsureStoreSelected::class,
            'master' => EnsureMasterAdmin::class,
        ]);

        // Signed-in visitors of guest pages (login): admins go to the admin area, staff to the POS.
        $middleware->redirectUsersTo(fn (Request $request) => $request->user()?->is_master_admin && ! $request->session()->has('store_id')
            ? route('admin.dashboard')
            : route('dashboard'));
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin', 'admin/*') ? route('admin.login') : route('login'));
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
