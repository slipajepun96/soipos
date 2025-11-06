<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('agent_name');
            $table->string('agent_nric')->unique();
            $table->string('agent_address');
            $table->string('agent_phone_num');
            $table->string('agent_email');
            $table->string('agent_social_media')->nullable();
            $table->string('agent_social_media_link')->nullable();
            $table->string('agent_status')->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
