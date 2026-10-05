<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();

            $table->string('code', 50)->unique();

            $table->string('name_ar');
            $table->string('name_en')->nullable();

            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();

            $table->string('billing_cycle', 20);

            $table->decimal('price', 10, 2);
            $table->string('currency', 10)->default('SAR');

            $table->json('benefits')->nullable();

            $table->decimal('savings_percent', 5, 2)->nullable();

            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index([
                'is_active',
                'sort_order',
            ]);

            $table->index('billing_cycle');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
