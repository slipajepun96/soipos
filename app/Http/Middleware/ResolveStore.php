<?php

namespace App\Http\Middleware;

use App\Support\CurrentStore;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the current store for signed-in staff from the session (chosen at login).
 * Runs on every web request, so nothing carries over between requests.
 */
class ResolveStore
{
    public function handle(Request $request, Closure $next): Response
    {
        $previous = CurrentStore::id();   // always null in production; kept for tests
        CurrentStore::set(null);

        $user = $request->user();
        $storeId = $request->hasSession() ? $request->session()->get('store_id') : null;
        if ($user && $storeId) {
            if ($user->is_active && $user->canUseStore($storeId)) {
                CurrentStore::set($storeId);
            } else {
                $request->session()->forget('store_id'); // unassigned or store closed meanwhile
            }
        }

        try {
            return $next($request);
        } finally {
            CurrentStore::set($previous);
        }
    }
}
