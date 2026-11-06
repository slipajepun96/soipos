<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Photo of the customer's bank transfer / DuitNow success screen, attached to a payment.
 * Stored privately and only shown to signed-in staff of the same store.
 */
class PaymentProofController extends Controller
{
    public function store(Request $request, Sale $sale, SalePayment $payment): JsonResponse
    {
        abort_unless($payment->sale_id === $sale->id, 404);
        if ($sale->status === 'voided') {
            throw ValidationException::withMessages(['proof' => 'This sale has been voided.']);
        }

        $request->validate(
            ['proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192']],
            [
                'proof.required' => 'Take or choose a photo of the payment.',
                'proof.image' => 'The payment proof must be a picture.',
                'proof.mimes' => 'The payment proof must be a JPG, PNG or WEBP picture.',
                'proof.max' => 'The payment proof photo must be 8 MB or smaller.',
                'proof.uploaded' => 'The photo could not be uploaded. It may be too large.',
            ],
        );

        $file = $request->file('proof');
        $path = $file->storeAs(
            'payment-proofs/' . $sale->store_id,
            Str::uuid() . '.' . ($file->extension() ?: 'jpg'),
            SalePayment::PROOF_DISK,
        );
        if (! $path) {
            throw ValidationException::withMessages(['proof' => 'The photo could not be saved on the server.']);
        }

        $payment->deleteProofFile(); // replacing an earlier photo
        $payment->update(['proof_path' => $path]);

        return response()->json(['payment' => $payment->fresh()]);
    }

    public function show(Sale $sale, SalePayment $payment): BinaryFileResponse
    {
        abort_unless($payment->sale_id === $sale->id && $payment->proof_path, 404);

        $disk = Storage::disk(SalePayment::PROOF_DISK);
        abort_unless($disk->exists($payment->proof_path), 404, 'The payment proof photo is missing.');

        return response()->file($disk->path($payment->proof_path), [
            'Cache-Control' => 'private, max-age=86400',
        ]);
    }

    public function destroy(Sale $sale, SalePayment $payment): JsonResponse
    {
        abort_unless($payment->sale_id === $sale->id, 404);

        $payment->deleteProofFile();
        $payment->update(['proof_path' => null]);

        return response()->json(['payment' => $payment->fresh()]);
    }
}
