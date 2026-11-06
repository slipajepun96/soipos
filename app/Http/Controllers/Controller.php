<?php

namespace App\Http\Controllers;

use App\Support\ErrorDescriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

abstract class Controller
{
    /**
     * For catch blocks: lets form validation through untouched, otherwise logs the
     * error and goes back with the specific reason, e.g.
     * "Could not save the product. Database: Already exists: "ABC" is already used for product code."
     */
    protected function failed(Throwable $e, string $action): RedirectResponse
    {
        if ($e instanceof ValidationException) {
            throw $e;
        }
        report($e);

        [, $reason] = ErrorDescriber::describe($e, (bool) auth()->user());

        return redirect()->back()
            ->withInput()
            ->withErrors(['error' => "Could not {$action}. {$reason}"]);
    }
}
