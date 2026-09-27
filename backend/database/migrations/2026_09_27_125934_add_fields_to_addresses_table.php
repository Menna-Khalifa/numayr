<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('label')->nullable()->after('user_id');
            $table->string('city')->after('label');
            $table->string('district')->nullable()->after('city');
            $table->string('street')->nullable()->after('district');
            $table->string('building')->nullable()->after('street');
            $table->string('postal_code', 20)->nullable()->after('building');

            $table->decimal('latitude', 10, 7)->nullable()->after('postal_code');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');

            $table->text('notes')->nullable()->after('longitude');
            $table->boolean('is_default')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropForeign(['user_id']);

            $table->dropColumn([
                'user_id',
                'label',
                'city',
                'district',
                'street',
                'building',
                'postal_code',
                'latitude',
                'longitude',
                'notes',
                'is_default',
            ]);
        });
    }
};