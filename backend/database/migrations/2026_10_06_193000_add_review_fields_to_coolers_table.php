<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->string('approval_status', 30)
                ->default('approved')
                ->after('status');

            $table->text('rejection_reason')
                ->nullable()
                ->after('approval_status');

            $table->timestamp('reviewed_at')
                ->nullable()
                ->after('rejection_reason');

            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->after('reviewed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['approval_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('coolers', function (Blueprint $table) {
            $table->dropIndex(['approval_status', 'created_at']);
            $table->dropConstrainedForeignId('reviewed_by_user_id');
            $table->dropColumn([
                'approval_status',
                'rejection_reason',
                'reviewed_at',
            ]);
        });
    }
};
