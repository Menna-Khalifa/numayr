<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'order:id,order_number,status,payment_status',
                'payment:id,order_id,method,status,transaction_id,paid_at,refunded_at',
            ])
            ->latest('issued_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => [
                'invoices' => $invoices,
            ],
        ]);
    }

    public function show(Request $request, int $invoice): JsonResponse
    {
        $invoiceModel = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'order:id,order_number,status,payment_status',
                'payment:id,order_id,method,status,transaction_id,provider_reference,paid_at,refunded_at',
            ])
            ->findOrFail($invoice);

        return response()->json([
            'success' => true,
            'data' => [
                'invoice' => $invoiceModel,
            ],
        ]);
    }
}