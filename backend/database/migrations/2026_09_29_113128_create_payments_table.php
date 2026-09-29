<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('provider', 50)->nullable();
            $table->string('method', 50)->nullable();

            $table->string('status', 30)->default('pending');

            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');

            $table->string('transaction_id', 150)->nullable()->unique();
            $table->string('provider_reference', 150)->nullable();

            $table->text('failure_reason')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->index(['provider', 'provider_reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};