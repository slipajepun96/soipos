<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('Configuration/SystemConfigurationIndex', [
            'settings' => Setting::store(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_reg_no' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'receipt_footer' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::setMany($validated);

        return back()->with(['type' => 'success', 'message' => 'Settings saved.']);
    }

    /** Upload (or replace) this store's DuitNow QR picture. */
    public function uploadDuitNowQr(Request $request): RedirectResponse
    {
        $request->validate(
            ['duitnow_qr' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096']],
            [
                'duitnow_qr.required' => 'Choose the DuitNow QR picture to upload.',
                'duitnow_qr.image' => 'The DuitNow QR must be a picture (JPG, PNG or WebP).',
                'duitnow_qr.mimes' => 'The DuitNow QR must be JPG, PNG or WebP.',
                'duitnow_qr.max' => 'The DuitNow QR picture is too large (maximum 4 MB).',
                'duitnow_qr.uploaded' => 'The DuitNow QR picture could not be uploaded. It may be too large for the server.',
            ],
        );

        $old = Setting::store()['duitnow_qr'];
        $file = $request->file('duitnow_qr');
        $path = $file->storeAs('duitnow', Str::uuid().'.'.$file->extension(), 'public');
        Setting::setMany(['duitnow_qr' => '/storage/'.$path]);
        $this->deleteQrFile($old);

        return back()->with(['type' => 'success', 'message' => 'DuitNow QR saved. It shows at the POS when E-Wallet is selected.']);
    }

    public function deleteDuitNowQr(): RedirectResponse
    {
        $this->deleteQrFile(Setting::store()['duitnow_qr']);
        Setting::setMany(['duitnow_qr' => null]);

        return back()->with(['type' => 'success', 'message' => 'DuitNow QR removed.']);
    }

    private function deleteQrFile(?string $url): void
    {
        if ($url && str_starts_with($url, '/storage/duitnow/')) {
            Storage::disk('public')->delete(substr($url, strlen('/storage/')));
        }
    }
}
