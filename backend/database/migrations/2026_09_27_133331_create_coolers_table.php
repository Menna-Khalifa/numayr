<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coolers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('address_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('name');

            $table->string('photo')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('landmark')->nullable();

            $table->string('filter_type')->nullable();
            $table->date('filter_installed_at')->nullable();

            $table->string('status', 30)->default('unknown');

            $table->unsignedTinyInteger('health_score')
                ->nullable();

            $table->timestamp('last_refill_at')->nullable();
            $table->timestamp('last_maintenance_at')->nullable();

            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coolers');
    }
};