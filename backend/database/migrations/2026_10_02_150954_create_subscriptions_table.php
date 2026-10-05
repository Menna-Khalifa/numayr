<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('plan_code', 50);
            $table->string('plan_name_ar');
            $table->string('plan_name_en')->nullable();

            $table->string('billing_cycle', 20);
            $table->decimal('price', 10, 2);
            $table->string('currency', 10)->default('SAR');

            $table->string('status', 30)->default('pending');

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            $table->json('benefits')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['plan_code', 'billing_cycle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
