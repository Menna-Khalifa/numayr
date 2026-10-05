<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_benefit_usages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('subscription_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('order_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('cooler_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('benefit_code', 100);

            $table->unsignedInteger('quantity')
                ->default(1);

            $table->string('status', 30)
                ->default('reserved');

            $table->json('metadata')
                ->nullable();

            $table->timestamp('reserved_at')
                ->nullable();

            $table->timestamp('consumed_at')
                ->nullable();

            $table->timestamp('released_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'subscription_id',
                'benefit_code',
                'status',
            ]);

            $table->index([
                'order_id',
                'benefit_code',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_benefit_usages');
    }
};
