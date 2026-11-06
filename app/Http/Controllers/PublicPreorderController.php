<?php

namespace App\Http\Controllers;

use App\Models\Preorder;
use App\Models\PreorderSession;
use App\Models\Setting;
use App\Services\PreorderService;
use App\Models\Store;
use App\Support\CurrentStore;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The customer-facing order form. No login; only what the customer needs is exposed.
 */
class PublicPreorderController extends Controller
{
    public function __construct(private PreorderService $preorders)
    {
    }

    public function show(string $token)
    {
        $session = $this->session($token);
        $remaining = $this->preorders->remaining($session);

        return Inertia::render('Public/PreorderForm', [
            'token' => $token,
            'shop' => $this->shop(),
            'session' => $this->publicSession($session),
            'accepting' => $session->acceptingOrders(),
            'items' => $session->items->map(fn ($item) => [
                'id' => $item->id,
                'label' => $item->label,
                'price' => $item->price,
                'max' => $item->max_per_order,
                'left' => $remaining[$item->id],
                'image' => $item->product?->product_img_address,
            ])->values(),
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $session = $this->session($token);

        // Bots fill every field; people never see this one.
        if (filled($request->input('website'))) {
            return back();
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s\-]{6,18}$/'],
            'address' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array'],
            'items.*' => ['nullable', 'integer', 'min:0', 'max:999'],
        ], [
            'phone.regex' => 'Enter a valid phone number, e.g. 012-345 6789.',
            'items.required' => 'Choose at least one item.',
        ]);

        $order = $this->preorders->place($session, [
            'name' => trim($validated['name']),
            'phone' => trim($validated['phone']),
            'address' => trim($validated['address']),
            'notes' => $validated['notes'] ?? null,
        ], $validated['items']);

        return redirect()->route('preorder.thanks', [$token, $order->id]);
    }

    public function thanks(string $token, string $order)
    {
        $session = $this->session($token);   // sets the store, so the order lookup below is scoped
        $order = Preorder::where('preorder_session_id', $session->id)->findOrFail($order);

        return Inertia::render('Public/PreorderThanks', [
            'token' => $token,
            'shop' => $this->shop(),
            'session' => $this->publicSession($session),
            'order' => $order->load('lines:id,preorder_id,label,quantity,unit_price,line_total')
                ->only(['id', 'order_no', 'customer_name', 'customer_phone', 'customer_address', 'notes', 'total', 'status', 'lines'])
                + ['ordered_at' => $order->created_at->format('d/m/Y g:i A')],
        ]);
    }

    /** The link's session; also switches this request to that session's store. */
    private function session(string $token): PreorderSession
    {
        $session = PreorderSession::withoutGlobalScope('store')->where('public_token', $token)->firstOrFail();
        abort_unless(Store::whereKey($session->store_id)->where('is_active', true)->exists(), 404);
        CurrentStore::set($session->store_id);

        return $session->load('items.product:id,product_img_address');
    }

    private function publicSession(PreorderSession $session): array
    {
        return collect($session->toArray())
            ->only(['name', 'pickup_location', 'pickup_date', 'pickup_time', 'remarks', 'closes_at'])
            ->all();
    }

    private function shop(): array
    {
        $store = Setting::store();

        return ['name' => $store['store_name'], 'phone' => $store['phone']];
    }
}
