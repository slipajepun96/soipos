<?php

namespace App\Http\Middleware;

use App\Support\CurrentStore;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Store pages need a signed-in user working in a store they are assigned to. */
class EnsureStoreSelected
{
    public function handle(Request $request, Closure $next): Response
    {
        if (CurrentStore::id()) {
            return $next($request);
        }

        $user = $request->user();
        if ($user?->is_master_admin && ! $request->session()->has('store_id')) {
            return redirect()->route('admin.dashboard');
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $message = $user && ! $user->is_active
            ? 'Your account is disabled. Contact your administrator.'
            : 'Please log in and select your store.';

        return $request->expectsJson()
            ? response()->json(['message' => $message], 401)
            : redirect()->route('login')->with(['type' => 'error', 'message' => $message]);
    }
}
