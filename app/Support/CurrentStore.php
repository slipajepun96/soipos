<?php

namespace App\Support;

/**
 * The store the current request works in. Set by the ResolveStore middleware from the
 * session (staff) or by public pages from their link (pre-order form).
 * Every store-owned model is filtered by it; with no store set, store data is hidden.
 */
class CurrentStore
{
    private static ?string $id = null;

    public static function id(): ?string
    {
        return self::$id;
    }

    public static function set(?string $id): void
    {
        self::$id = $id;
    }

    /** Run something inside a store (console tasks, tests). */
    public static function using(?string $id, callable $callback): mixed
    {
        $previous = self::$id;
        self::$id = $id;
        try {
            return $callback();
        } finally {
            self::$id = $previous;
        }
    }
}
