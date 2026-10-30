<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->unique(
                'payment_id',
                'invoices_payment_id_unique'
            );
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(
                'payments_provider_provider_reference_index'
            );

            $table->unique(
                ['provider', 'provider_reference'],
                'payments_provider_provider_reference_unique'
            );
        });

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement("
                CREATE TRIGGER payments_target_xor_insert
                BEFORE INSERT ON payments
                FOR EACH ROW
                WHEN (
                    (NEW.order_id IS NULL AND NEW.subscription_id IS NULL)
                    OR
                    (NEW.order_id IS NOT NULL AND NEW.subscription_id IS NOT NULL)
                )
                BEGIN
                    SELECT RAISE(
                        ABORT,
                        'A payment must belong to exactly one target'
                    );
                END
            ");

            DB::statement("
                CREATE TRIGGER payments_target_xor_update
                BEFORE UPDATE OF order_id, subscription_id ON payments
                FOR EACH ROW
                WHEN (
                    (NEW.order_id IS NULL AND NEW.subscription_id IS NULL)
                    OR
                    (NEW.order_id IS NOT NULL AND NEW.subscription_id IS NOT NULL)
                )
                BEGIN
                    SELECT RAISE(
                        ABORT,
                        'A payment must belong to exactly one target'
                    );
                END
            ");

            return;
        }

        if ($driver === 'mysql') {
            foreach (['INSERT', 'UPDATE'] as $event) {
                $trigger = 'payments_target_xor_' . strtolower($event);
                DB::statement("
                    CREATE TRIGGER {$trigger}
                    BEFORE {$event} ON payments
                    FOR EACH ROW
                    BEGIN
                        IF (
                            (NEW.order_id IS NULL AND NEW.subscription_id IS NULL)
                            OR
                            (NEW.order_id IS NOT NULL AND NEW.subscription_id IS NOT NULL)
                        ) THEN
                            SIGNAL SQLSTATE '45000'
                            SET MESSAGE_TEXT = 'A payment must belong to exactly one target';
                        END IF;
                    END
                ");
            }

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('
                ALTER TABLE payments
                ADD CONSTRAINT payments_target_xor_check
                CHECK (
                    (
                        order_id IS NOT NULL
                        AND subscription_id IS NULL
                    )
                    OR
                    (
                        order_id IS NULL
                        AND subscription_id IS NOT NULL
                    )
                )
            ');

            return;
        }

        throw new RuntimeException(
            "Unsupported database driver for payments_target_xor_check: {$driver}"
        );
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement(
                'DROP TRIGGER IF EXISTS payments_target_xor_insert'
            );

            DB::statement(
                'DROP TRIGGER IF EXISTS payments_target_xor_update'
            );
        } elseif ($driver === 'mysql') {
            DB::statement('DROP TRIGGER IF EXISTS payments_target_xor_insert');
            DB::statement('DROP TRIGGER IF EXISTS payments_target_xor_update');
        } elseif ($driver === 'pgsql') {
            DB::statement(
                'ALTER TABLE payments DROP CONSTRAINT payments_target_xor_check'
            );
        } else {
            throw new RuntimeException(
                "Unsupported database driver for payments_target_xor_check: {$driver}"
            );
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(
                'payments_provider_provider_reference_unique'
            );

            $table->index(
                ['provider', 'provider_reference'],
                'payments_provider_provider_reference_index'
            );
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(
                'invoices_payment_id_unique'
            );
        });
    }
};
