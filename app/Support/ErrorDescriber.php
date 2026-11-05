<?php

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Turns an exception into a specific, readable message for toasts.
 * `$detailed` (signed-in staff) adds technical detail; customers get the plain reason only.
 */
class ErrorDescriber
{
    /** @return array{0:int,1:string} [status, message] */
    public static function describe(Throwable $e, bool $detailed): array
    {
        // Route model binding wraps "record not found" in a plain 404.
        if ($e instanceof HttpExceptionInterface && $e->getPrevious() instanceof ModelNotFoundException) {
            $e = $e->getPrevious();
        }

        return match (true) {
            $e instanceof TokenMismatchException => [419, 'Your session expired (security token mismatch). Refresh the page and try again.'],
            $e instanceof ModelNotFoundException => [404, self::modelName($e->getModel()).' not found. It may have been deleted.'],
            $e instanceof AuthorizationException => [403, 'You are not allowed to do that.'.(self::custom($e->getMessage(), 'This action is unauthorized.') ? ' '.$e->getMessage() : '')],
            $e instanceof ThrottleRequestsException => [429, 'Too many attempts. Try again in '.($e->getHeaders()['Retry-After'] ?? 60).' seconds.'],
            $e instanceof PostTooLargeException => [413, 'The upload is too large. Use a smaller file (limit '.ini_get('post_max_size').').'],
            $e instanceof QueryException => [500, self::database($e, $detailed)],
            $e instanceof HttpExceptionInterface => [$e->getStatusCode(), self::http($e)],
            default => [500, $detailed
                ? class_basename($e).': '.($e->getMessage() ?: 'no message').(config('app.debug') ? ' ('.basename($e->getFile()).':'.$e->getLine().')' : '')
                : 'Unexpected server error. Please try again, or contact the shop if it keeps happening.'],
        };
    }

    private static function http(HttpExceptionInterface $e): string
    {
        $status = $e->getStatusCode();
        $custom = self::custom($e->getMessage(), '');

        return match ($status) {
            404 => $custom ?: 'Page or record not found. It may have been deleted or the link is wrong.',
            403 => $custom ?: 'You are not allowed to do that.',
            405 => 'This action is not allowed here (method not allowed). Refresh the page and try again.',
            413 => 'The upload is too large. Use a smaller file.',
            503 => 'The system is under maintenance. Try again in a few minutes.',
            default => $custom ?: "Request failed (HTTP {$status}).",
        };
    }

    private static function database(QueryException $e, bool $detailed): string
    {
        $code = (int) ($e->errorInfo[1] ?? 0);
        $raw = $e->errorInfo[2] ?? $e->getMessage();

        $message = match ($code) {
            1062 => preg_match("/Duplicate entry '(.*)' for key '(?:[^.']*\.)?([^']+)'/", $raw, $m)
                ? "Already exists: \"{$m[1]}\" is already used for ".self::keyName($m[2], $e->getSql()).'.'
                : 'Already exists: a record with the same value is already saved.',
            1451 => preg_match('/a foreign key constraint fails \(`[^`]+`\.`([^`]+)`/', $raw, $m)
                ? 'Cannot delete or change this record because '.Str::of($m[1])->replace('_', ' ').' still use it.'
                : 'Cannot delete or change this record because other records still use it.',
            1452 => preg_match('/FOREIGN KEY \(`([^`]+)`\)/', $raw, $m)
                ? 'The selected '.Str::of($m[1])->replace(['_id', '_'], ['', ' ']).' does not exist any more. Refresh and choose again.'
                : 'A linked record does not exist any more. Refresh and try again.',
            1048 => preg_match("/Column '([^']+)'/", $raw, $m)
                ? 'Missing value: '.Str::of($m[1])->replace('_', ' ').' cannot be empty.'
                : 'A required value is missing.',
            1406 => preg_match("/column '([^']+)'/", $raw, $m)
                ? 'Too long: the text for '.Str::of($m[1])->replace('_', ' ').' is longer than allowed.'
                : 'One of the values is too long.',
            1264 => preg_match("/column '([^']+)'/", $raw, $m)
                ? 'Number too large for '.Str::of($m[1])->replace('_', ' ').'.'
                : 'One of the numbers is too large.',
            1366, 1292 => preg_match("/column '([^']+)'/", $raw, $m)
                ? 'Invalid value for '.Str::of($m[1])->replace('_', ' ').'.'
                : 'One of the values has the wrong format.',
            1205, 1213 => 'The database was busy with another save. Please try again.',
            2002, 2006, 2013 => 'Cannot connect to the database. Check that the database server is running.',
            default => null,
        };

        if ($message) {
            return 'Database: '.$message;
        }

        return $detailed
            ? 'Database error '.($e->errorInfo[0] ?? '').($code ? "/{$code}" : '').': '.Str::limit($raw, 200)
            : 'A database error stopped this. Please try again, or contact the shop.';
    }

    /** preorder_sessions_public_token_unique -> "public token" */
    private static function keyName(string $key, string $sql): string
    {
        if (preg_match('/(?:into|update)\s+`?(\w+)`?/i', $sql, $t)) {
            $key = Str::after($key, $t[1].'_');
        }

        return Str::of($key)->replaceMatches('/_(unique|index|primary)$/', '')->replace('_', ' ')->toString();
    }

    private static function modelName(string $class): string
    {
        return Str::of(class_basename($class))->snake(' ')->ucfirst();
    }

    private static function custom(string $message, string $default): ?string
    {
        return $message !== '' && $message !== $default ? $message : null;
    }
}
