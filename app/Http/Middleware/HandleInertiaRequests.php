<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // The store this session works in (null on public and admin pages).
            'store' => fn () => ($id = \App\Support\CurrentStore::id())
                ? \App\Models\Store::whereKey($id)->first(['id', 'name', 'code'])
                : null,
            // Controllers flash either message+type, or success / error.
            'flash' => fn () => [
                'message' => $request->session()->get('message')
                    ?? $request->session()->get('success')
                    ?? $request->session()->get('error'),
                'type' => $request->session()->get('type')
                    ?? ($request->session()->has('error') ? 'error' : ($request->session()->has('success') ? 'success' : null)),
            ],
        ];
    }
}
