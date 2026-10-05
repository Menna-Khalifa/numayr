<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('subscription_id')
                ->nullable()
                ->after('order_id')
                ->constrained()
                ->nullOnDelete();

            $table->index([
                'subscription_id',
                'status',
            ]);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('order_id')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex([
                'subscription_id',
                'status',
            ]);

            $table->dropConstrainedForeignId('subscription_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('order_id')
                ->nullable(false)
                ->change();
        });
    }
};
