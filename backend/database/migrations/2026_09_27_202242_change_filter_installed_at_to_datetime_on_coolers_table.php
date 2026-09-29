<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->dateTime('filter_installed_at')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->date('filter_installed_at')
                ->nullable()
                ->change();
        });
    }
};