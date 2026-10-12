
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('quote_status', 30)
                ->nullable();

            $table->decimal('quote_subtotal', 12, 2)
                ->nullable();

            $table->text('quote_notes')
                ->nullable();

            $table->foreignId('quoted_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('quoted_at')
                ->nullable();

            $table->timestamp('quote_approved_at')
                ->nullable();

            $table->timestamp('quote_rejected_at')
                ->nullable();

            $table->index('quote_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['quote_status']);

            $table->dropForeign(['quoted_by_user_id']);

            $table->dropColumn([
                'quote_status',
                'quote_subtotal',
                'quote_notes',
                'quoted_by_user_id',
                'quoted_at',
                'quote_approved_at',
                'quote_rejected_at',
            ]);
        });
    }
};
