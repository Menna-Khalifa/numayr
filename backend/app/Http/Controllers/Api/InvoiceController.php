<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'order:id,order_number,status,payment_status',
                'payment:id,order_id,method,status,paid_at,refunded_at',
            ])
            ->latest('issued_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => [
                'invoices' => InvoiceResource::collection($invoices),
            ],
        ]);
    }

    public function show(
        Request $request,
        int $invoice
    ): JsonResponse {
        $invoiceModel = $this->findOwnedInvoice(
            $request,
            $invoice
        );

        return response()->json([
            'success' => true,
            'data' => [
                'invoice' => new InvoiceResource($invoiceModel),
            ],
        ]);
    }

    public function pdf(
        Request $request,
        int $invoice
    ): Response {
        $invoiceModel = $this->findOwnedInvoice(
            $request,
            $invoice
        );

        $pdfContent = $this->renderPdf($invoiceModel);

        return $this->pdfResponse(
            $pdfContent,
            $this->pdfFilename($invoiceModel),
            false
        );
    }

    public function download(
        Request $request,
        int $invoice
    ): Response {
        $invoiceModel = $this->findOwnedInvoice(
            $request,
            $invoice
        );

        $pdfContent = $this->renderPdf($invoiceModel);

        return $this->pdfResponse(
            $pdfContent,
            $this->pdfFilename($invoiceModel),
            true
        );
    }

    public function share(
        Request $request,
        int $invoice
    ): JsonResponse {
        $invoiceModel = $this->findOwnedInvoice(
            $request,
            $invoice
        );

        $expiresAt = now()->addMinutes(30);

        $url = URL::temporarySignedRoute(
            'invoices.shared.pdf',
            $expiresAt,
            [
                'invoice' => $invoiceModel->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء رابط مشاركة آمن للفاتورة',
            'data' => [
                'share_url' => $url,
                'expires_at' => $expiresAt->toISOString(),
                'expires_in_minutes' => 30,
            ],
        ]);
    }

    public function sharedPdf(int $invoice): Response
    {
        $invoiceModel = Invoice::query()
            ->with([
                'order:id,order_number,status,payment_status',
                'payment:id,order_id,method,status,transaction_id,provider_reference,paid_at,refunded_at',
            ])
            ->findOrFail($invoice);

        $pdfContent = $this->renderPdf($invoiceModel);

        return $this->pdfResponse(
            $pdfContent,
            $this->pdfFilename($invoiceModel),
            false
        );
    }

    private function findOwnedInvoice(
        Request $request,
        int $invoice
    ): Invoice {
        return Invoice::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'order:id,order_number,status,payment_status',
                'payment:id,order_id,method,status,transaction_id,provider_reference,paid_at,refunded_at',
            ])
            ->findOrFail($invoice);
    }

    private function renderPdf(Invoice $invoice): string
    {
        $tempDir = storage_path('app/mpdf-temp');

        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'tempDir' => $tempDir,
            'default_font' => 'dejavusans',
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'margin_top' => 12,
            'margin_right' => 12,
            'margin_bottom' => 12,
            'margin_left' => 12,
        ]);

        $mpdf->SetDirectionality('rtl');

        $mpdf->WriteHTML(
            view('invoices.pdf', [
                'invoice' => $invoice,
            ])->render()
        );

        return $mpdf->Output(
            '',
            Destination::STRING_RETURN
        );
    }

    private function pdfResponse(
        string $pdfContent,
        string $filename,
        bool $download
    ): Response {
        $disposition = $download
            ? 'attachment'
            : 'inline';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    private function pdfFilename(Invoice $invoice): string
    {
        return 'numayr-invoice-'
            .$invoice->invoice_number
            .'.pdf';
    }
}
