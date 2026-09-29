<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_webhook_events', function (Blueprint $table) {
            $table->id();

            $table->string('provider', 50);
            $table->string('event_id', 150)->nullable();
            $table->string('payload_hash', 64);

            $table->foreignId('payment_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('provider_reference', 150)->nullable();
            $table->string('event_status', 50)->nullable();

            $table->json('payload');

            $table->string('processing_status', 30)->default('received');
            $table->text('error_message')->nullable();

            $table->timestamp('processed_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['provider', 'payload_hash'],
                'payment_webhook_provider_hash_unique'
            );

            $table->index(['provider', 'event_id']);
            $table->index(['provider_reference', 'processing_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');
    }
};