<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('subscription_id')
                ->nullable()
                ->after('service_id')
                ->constrained()
                ->nullOnDelete();

            $table->string('subscription_plan_code', 50)
                ->nullable()
                ->after('subscription_id');

            $table->json('subscription_snapshot')
                ->nullable()
                ->after('subscription_plan_code');

            $table->decimal('discount_percent', 5, 2)
                ->default(0)
                ->after('urgent_fee');

            $table->decimal('discount_amount', 10, 2)
                ->default(0)
                ->after('discount_percent');

            $table->index([
                'user_id',
                'subscription_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex([
                'user_id',
                'subscription_id',
                'status',
            ]);

            $table->dropForeign(['subscription_id']);

            $table->dropColumn([
                'subscription_id',
                'subscription_plan_code',
                'subscription_snapshot',
                'discount_percent',
                'discount_amount',
            ]);
        });
    }
};
