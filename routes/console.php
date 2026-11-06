<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// First master admin (or promote an existing user): php artisan soipos:master-admin you@gmail.com
// They then sign in at /admin/login with that Google account.
Artisan::command('soipos:master-admin {email?}', function (?string $email = null) {
    $email = strtolower(trim($email ?: $this->ask('Google account email')));
    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('That is not a valid email address.');

        return 1;
    }

    $user = \App\Models\User::whereRaw('LOWER(email) = ?', [$email])->first()
        ?? \App\Models\User::create(['name' => $this->ask('Name', \Illuminate\Support\Str::before($email, '@')), 'email' => $email, 'is_active' => true]);

    $user->forceFill(['is_master_admin' => true, 'is_active' => true])->save();
    $this->info("{$user->email} is a master admin. Sign in with Google at ".route('admin.login'));

    return 0;
})->purpose('Approve a Google account as master admin');
