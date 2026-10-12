<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'email')) {
            if (\Illuminate\Support\Facades\DB::table('users')->whereNull('email')->exists()) {
                throw new \RuntimeException(
                    'Cannot make email required while users without email exist.'
                );
            }

            Schema::table('users', function (Blueprint $table) {
                $table->string('email')->nullable(false)->change();
            });
        }
    }
};