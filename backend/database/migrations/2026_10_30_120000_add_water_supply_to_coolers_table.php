<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->string('water_source', 20)->nullable()->after('filter_type');
            $table->unsignedInteger('tank_capacity_liters')->nullable()->after('water_source');
        });
    }

    public function down(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->dropColumn(['water_source', 'tank_capacity_liters']);
        });
    }
};
