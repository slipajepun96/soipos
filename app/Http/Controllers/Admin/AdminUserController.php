<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Users', [
            'users' => User::with('stores:id,name')->orderBy('name')->get()
                ->map(fn (User $u) => $u->only(['id', 'name', 'email', 'avatar', 'is_master_admin', 'is_active', 'created_at']) + [
                    'google_linked' => (bool) $u->google_id,
                    'store_ids' => $u->stores->pluck('id'),
                    'store_names' => $u->stores->pluck('name'),
                ]),
            'stores' => Store::orderBy('name')->get(['id', 'name', 'is_active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'is_active' => true]);
            $user->forceFill(['is_master_admin' => $data['is_master_admin'] ?? false])->save();
            $user->stores()->sync($data['store_ids'] ?? []);
        });

        return back()->with(['type' => 'success', 'message' => "{$data['email']} approved. They can now sign in with Google."]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $this->validated($request, $user);
        $self = $request->user()->is($user);

        DB::transaction(function () use ($user, $data, $self) {
            $user->fill(['name' => $data['name'], 'email' => $data['email']]);
            if ($user->isDirty('email')) {
                // A different Google account: unlink the old one; the new one links on first sign-in.
                $user->forceFill(['google_id' => null, 'avatar' => null]);
            }
            if (! $self) { // you cannot lock yourself out
                $user->is_master_admin = $data['is_master_admin'] ?? false;
                $user->is_active = $data['is_active'] ?? true;
            }
            $user->save();
            $user->stores()->sync($data['store_ids'] ?? []);
        });

        return back()->with(['type' => 'success', 'message' => "User {$user->name} saved."]);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->with(['type' => 'error', 'message' => 'You cannot delete your own account.']);
        }
        $user->delete();

        return back()->with(['type' => 'success', 'message' => "User {$user->name} deleted."]);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'is_master_admin' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'store_ids' => ['array'],
            'store_ids.*' => ['string', Rule::exists('stores', 'id')],
        ], [
            'email.unique' => 'This Google account is already approved for another user.',
        ], [
            'store_ids.*' => 'store',
        ]);
    }
}
