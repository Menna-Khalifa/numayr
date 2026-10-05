<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->string('idempotency_key', 200)
                ->nullable()
                ->after('event_id');
        });

        DB::table('payment_webhook_events')
            ->orderBy('id')
            ->chunkById(100, function ($events) {
                foreach ($events as $event) {
                    $key = $event->event_id
                        ? 'event:'.$event->event_id
                        : 'hash:'.$event->payload_hash;

                    DB::table('payment_webhook_events')
                        ->where('id', $event->id)
                        ->update([
                            'idempotency_key' => $key,
                        ]);
                }
            });

        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->dropUnique(
                'payment_webhook_provider_hash_unique'
            );

            $table->unique(
                ['provider', 'idempotency_key'],
                'payment_webhook_provider_idempotency_unique'
            );

            $table->unique(
                ['provider', 'event_id'],
                'payment_webhook_provider_event_unique'
            );

            $table->index(
                ['provider', 'payload_hash'],
                'payment_webhook_provider_hash_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->dropIndex(
                'payment_webhook_provider_hash_index'
            );

            $table->dropUnique(
                'payment_webhook_provider_event_unique'
            );

            $table->dropUnique(
                'payment_webhook_provider_idempotency_unique'
            );

            $table->unique(
                ['provider', 'payload_hash'],
                'payment_webhook_provider_hash_unique'
            );

            $table->dropColumn('idempotency_key');
        });
    }
};
