<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('subscriptions:expire')
    ->hourly()
    ->withoutOverlapping();

Schedule::command('coolers:smart-reminders')
    ->dailyAt('09:00')
    ->timezone('Asia/Riyadh')
    ->withoutOverlapping();

/*
|--------------------------------------------------------------------------
| First-time account provisioning
|--------------------------------------------------------------------------
| This command is intentionally interactive: credentials are entered on the
| server and are never stored in Git, shell history, or the command options.
*/
Artisan::command('numayr:provision-accounts', function () {
    $accounts = [
        ['label' => 'Admin', 'name' => 'Admin', 'role' => 'admin'],
        ['label' => 'Web Team', 'name' => 'Web Team', 'role' => 'customer'],
    ];

    $inputs = [];
    foreach ($accounts as $account) {
        $email = strtolower(trim((string) $this->ask($account['label'].' email')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email for '.$account['label'].'. No changes made.');
            return 1;
        }
        $password = (string) $this->secret($account['label'].' new password (min 12 characters)');
        $confirmation = (string) $this->secret('Confirm '.$account['label'].' password');
        if (strlen($password) < 12 || $password !== $confirmation) {
            $this->error('Password must be 12+ characters and match confirmation. No changes made.');
            return 1;
        }
        $inputs[] = [...$account, 'email' => $email, 'password' => $password];
    }

    if ($inputs[0]['email'] === $inputs[1]['email']) {
        $this->error('Admin and Web Team emails must differ. No changes made.');
        return 1;
    }

    if (! $this->confirm('Create/update these two accounts in the CURRENT database?', false)) {
        $this->warn('Cancelled. No changes made.');
        return 0;
    }

    \Illuminate\Support\Facades\DB::transaction(function () use ($inputs) {
        foreach ($inputs as $input) {
            \App\Models\User::updateOrCreate(
                ['email' => $input['email']],
                [
                    'name' => $input['name'],
                    'role' => $input['role'],
                    'password' => \Illuminate\Support\Facades\Hash::make($input['password']),
                    'is_active' => true,
                ]
            );
        }
    });

    $this->info('Admin and Web Team accounts provisioned in the current database.');
    $this->line('Passwords were not saved to GitHub or printed to this terminal.');
    return 0;
})->purpose('Interactively provision the Admin and Web Team accounts');
