<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_docs', function (Blueprint $table) {
            $table->string('stock_doc_num')->nullable()->after('id')->index();
            $table->string('transportation_mode')->nullable();
            $table->string('remarks')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('stock_docs', function (Blueprint $table) {
            $table->dropColumn(['stock_doc_num', 'transportation_mode', 'remarks']);
        });
    }
};
