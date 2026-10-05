<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderAttachmentController extends Controller
{
    public function show(
        Request $request,
        OrderAttachment $attachment
    ): StreamedResponse {
        $attachment->loadMissing('order');

        abort_unless(
            $attachment->order &&
            (int) $attachment->order->user_id === (int) $request->user()->id,
            404
        );

        return $this->fileResponse($attachment);
    }

    public function adminShow(
        OrderAttachment $attachment
    ): StreamedResponse {
        return $this->fileResponse($attachment);
    }

    private function fileResponse(
        OrderAttachment $attachment
    ): StreamedResponse {
        abort_unless(
            in_array($attachment->disk, ['local', 'public'], true),
            404
        );

        abort_unless(
            Storage::disk($attachment->disk)->exists($attachment->path),
            404
        );

        return Storage::disk($attachment->disk)->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type
                    ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="'.
                    addslashes($attachment->original_name).
                    '"',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }
}
