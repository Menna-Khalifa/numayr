<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();

            $table->string('code', 50)->unique();

            $table->string('name_ar');
            $table->string('name_en')->nullable();

            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();

            $table->string('pricing_model', 30);

            $table->decimal('base_price', 12, 2)->nullable();
            $table->decimal('unit_price', 12, 4)->nullable();

            $table->string('unit', 30)->nullable();

            $table->unsignedInteger('minimum_quantity')->nullable();
            $table->unsignedInteger('maximum_quantity')->nullable();
            $table->unsignedInteger('quantity_step')->nullable();

            $table->decimal('urgent_fee', 12, 2)->default(0);

            $table->json('settings')->nullable();

            $table->boolean('requires_cooler')->default(true);
            $table->boolean('is_active')->default(true);

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};