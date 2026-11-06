<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Where users have UUID ids, sessions.user_id must be text too (it was saving 0).
return new class extends Migration
{
    public function up(): void
    {
        if (in_array(Schema::getColumnType('users', 'id'), ['char', 'varchar', 'string', 'uuid'], true)
            && Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->string('user_id', 36)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Left as text: converting back would lose the ids.
    }
};
