<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->foreignId('address_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();

            $table->unsignedInteger('coolers_count')
                ->default(1)
                ->after('address_id');

            $table->index([
                'user_id',
                'address_id',
                'status',
            ]);
        });

        Schema::create('subscription_cooler', function (Blueprint $table) {
            $table->id();

            $table->foreignId('subscription_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('cooler_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'subscription_id',
                'cooler_id',
            ]);

            $table->index([
                'cooler_id',
                'subscription_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_cooler');

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex([
                'user_id',
                'address_id',
                'status',
            ]);

            $table->dropConstrainedForeignId('address_id');
            $table->dropColumn('coolers_count');
        });
    }
};
