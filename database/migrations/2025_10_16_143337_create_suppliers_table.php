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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamps();
            $table->string('supplier_name');
            $table->string('supplier_address');
            $table->string('supplier_rob_num');
            $table->string('supplier_contact_person');
            $table->string('supplier_phone_num');
            $table->string('supplier_email')->nullable();
            $table->string('supplier_tax_identification_num')->nullable();
            $table->string('supplier_remark')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
