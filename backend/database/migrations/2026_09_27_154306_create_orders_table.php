<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->string('order_number', 30)->unique();

            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('cooler_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('service_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('address_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Snapshot of service at time of order.
            $table->string('service_code', 50);
            $table->string('service_name');
            $table->string('pricing_model', 30);

            // Quantity / unit.
            $table->decimal('quantity', 12, 3)->nullable();
            $table->string('unit', 30)->nullable();

            // Pricing snapshot.
            $table->decimal('base_price', 12, 2)->default(0);
            $table->decimal('unit_price', 12, 4)->nullable();
            $table->decimal('urgent_fee', 12, 2)->default(0);

            $table->decimal('subtotal', 12, 2)->default(0);

            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);

            $table->decimal('total_amount', 12, 2)->default(0);

            $table->string('currency', 3)->default('SAR');

            // Scheduling.
            $table->string('priority', 20)->default('standard');
            $table->date('preferred_date')->nullable();
            $table->string('preferred_time_slot', 30)->nullable();
            $table->timestamp('scheduled_at')->nullable();

            // Order lifecycle.
            $table->string('status', 30)->default('pending');
            $table->string('payment_status', 30)->default('pending');

            // Service-specific values:
            // maintenance issue, filter option, custom selections, etc.
            $table->json('service_data')->nullable();

            // Preserve delivery/service location even if user edits address later.
            $table->json('address_snapshot')->nullable();

            $table->text('notes')->nullable();

            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['cooler_id', 'status']);
            $table->index(['service_code', 'status']);
            $table->index(['payment_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};