<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * The only way to sign in: Google. A Google account may continue only if the master
 * admin has added its email as a user (approved), the user is active, and
 *  - store login: the user is assigned to the chosen store;
 *  - admin login: the user is a master admin.
 */
class GoogleAuthController extends Controller
{
    public const NOT_ALLOWED = 'This Google account (:email) is not allowed to proceed. Ask your administrator to approve it.';

    /** Start: remember what the person is signing in to, then go to Google. */
    public function redirect(Request $request): RedirectResponse
    {
        $intent = $request->query('intent') === 'admin' ? 'admin' : 'store';

        if ($intent === 'store') {
            $request->validate(
                ['store_id' => ['required', 'string', Rule::exists('stores', 'id')->where('is_active', true)]],
                ['store_id.required' => 'Select your store.', 'store_id.exists' => 'Select your store.'],
            );
        }

        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return $this->fail($intent, 'google', 'Sign in with Google is not set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the .env file.');
        }

        $request->session()->put('google_login', [
            'intent' => $intent,
            'store_id' => $intent === 'store' ? $request->query('store_id') : null,
        ]);

        return Socialite::driver('google')
            ->with(['prompt' => 'select_account'])   // always let them pick the account
            ->redirect();
    }

    /** Back from Google: check the account is approved for what they asked for. */
    public function callback(Request $request): RedirectResponse
    {
        $login = $request->session()->pull('google_login', ['intent' => 'store', 'store_id' => null]);
        $intent = $login['intent'];

        if ($request->has('error')) { // e.g. pressed Cancel on Google's page
            return $this->fail($intent, 'google', 'Google sign-in was cancelled.');
        }

        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            report($e);

            return $this->fail($intent, 'google', 'Google sign-in failed or expired. Please try again.');
        }

        $email = strtolower((string) $google->getEmail());
        if ($email === '' || (($google->user['email_verified'] ?? true) === false)) {
            return $this->fail($intent, 'google', 'Your Google account has no verified email address.');
        }

        // Approved = added by the master admin. Match the linked Google id first, then the email.
        $user = User::where('google_id', $google->getId())->first()
            ?? User::whereRaw('LOWER(email) = ?', [$email])->first();

        $notAllowed = str_replace(':email', $email, self::NOT_ALLOWED);
        if (! $user || ! $user->is_active) {
            return $this->fail($intent, 'google', $notAllowed);
        }
        if ($user->google_id && $user->google_id !== $google->getId()) {
            return $this->fail($intent, 'google', $notAllowed); // email reused by a different Google account
        }

        if ($intent === 'admin' && ! $user->is_master_admin) {
            return $this->fail($intent, 'google', "This Google account ({$email}) is not a master admin. Use the store login.");
        }
        if ($intent === 'store' && ! $user->canUseStore($login['store_id'])) {
            return $this->fail($intent, 'store_id', 'Wrong store. Select the store you are assigned to.');
        }

        $user->forceFill([
            'google_id' => $google->getId(),
            'avatar' => $google->getAvatar(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        Auth::login($user);
        $request->session()->regenerate();

        if ($intent === 'admin') {
            $request->session()->forget('store_id');

            return redirect()->route('admin.dashboard');
        }

        $request->session()->put('store_id', $login['store_id']);

        return redirect()->intended(route('dashboard'));
    }

    private function fail(string $intent, string $field, string $message): RedirectResponse
    {
        return redirect()->route($intent === 'admin' ? 'admin.login' : 'login')->withErrors([$field => $message]);
    }
}
