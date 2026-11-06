<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
        Vite::prefetch(concurrency: 3);

        // Separate counters, so staff signing in never use up a customer's form submissions.
        RateLimiter::for('google-login', fn (Request $request) => Limit::perMinute(20)->by('google|'.$request->ip()));
        RateLimiter::for('public-form', fn (Request $request) => Limit::perMinute(10)->by('form|'.$request->route()?->getName().'|'.$request->ip()));
    }
}
