<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMasterAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('admin.login');
        }
        abort_unless($user->is_master_admin && $user->is_active, 403, 'Only the master admin can open this page.');

        return $next($request);
    }
}
