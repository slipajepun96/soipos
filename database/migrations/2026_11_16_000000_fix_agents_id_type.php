<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Agent ids are codes like "DA26000001", but the column was created as an integer,
// so every agent sign-up failed. Make it a string key.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->string('id', 20)->change();
        });
    }

    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->unsignedBigInteger('id', true)->change();
        });
    }
};
