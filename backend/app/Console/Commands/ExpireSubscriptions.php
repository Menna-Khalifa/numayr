<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('subscriptions:expire')]
#[Description('Mark active subscriptions as expired when their end date has passed')]
class ExpireSubscriptions extends Command
{
    public function handle(): int
    {
        $now = now();

        $expiredCount = DB::transaction(function () use ($now) {
            $subscriptions = Subscription::query()
                ->where('status', Subscription::STATUS_ACTIVE)
                ->whereNotNull('ends_at')
                ->where('ends_at', '<=', $now)
                ->lockForUpdate()
                ->get();

            foreach ($subscriptions as $subscription) {
                $subscription->update([
                    'status' => Subscription::STATUS_EXPIRED,
                ]);
            }

            return $subscriptions->count();
        });

        $this->info("Expired subscriptions: {$expiredCount}");

        return self::SUCCESS;
    }
}
