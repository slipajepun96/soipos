<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminStoreController extends Controller
{
    /** Admin home: every store with a few numbers. */
    public function index()
    {
        $count = fn (string $table, ?callable $where = null) => DB::table($table)
            ->when($where, $where)
            ->selectRaw('store_id, COUNT(*) as n')->groupBy('store_id')->pluck('n', 'store_id');

        $products = $count('products');
        $sales = $count('sales', fn ($q) => $q->where('status', '!=', 'voided'));
        $revenue = DB::table('sales')->where('status', '!=', 'voided')
            ->selectRaw('store_id, SUM(total) as t')->groupBy('store_id')->pluck('t', 'store_id');

        $stores = Store::withCount('users')->orderBy('name')->get()->map(fn (Store $s) => $s->toArray() + [
            'products_count' => (int) ($products[$s->id] ?? 0),
            'sales_count' => (int) ($sales[$s->id] ?? 0),
            'revenue' => round((float) ($revenue[$s->id] ?? 0), 2),
        ]);

        return Inertia::render('Admin/Stores', ['stores' => $stores]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $store = Store::create([
            'name' => $data['name'],
            'code' => ($data['code'] ?? null) ?: Store::makeCode($data['name']),
            'short_code' => $data['short_code'],
            'is_active' => true,
        ]);
        Setting::setMany(['store_name' => $store->name], $store->id);

        return back()->with(['type' => 'success', 'message' => "Store \"{$store->name}\" created. Assign users to it on the Users page."]);
    }

    public function update(Request $request, Store $store): RedirectResponse
    {
        $data = $this->validated($request, $store);
        $store->update([
            'name' => $data['name'],
            'code' => ($data['code'] ?? null) ?: Store::makeCode($data['name'], $store->id),
            'short_code' => $data['short_code'],
            'is_active' => $request->boolean('is_active', $store->is_active),
        ]);

        return back()->with(['type' => 'success', 'message' => $store->is_active
            ? "Store \"{$store->name}\" saved."
            : "Store \"{$store->name}\" is closed. Its users can no longer log in to it."]);
    }

    /** Master admin jumps into a store (POS, products, sales...) without logging out. */
    public function enter(Request $request, Store $store): RedirectResponse
    {
        if (! $store->is_active) {
            return back()->with(['type' => 'error', 'message' => "\"{$store->name}\" is closed. Open it first."]);
        }
        $request->session()->put('store_id', $store->id);

        return redirect()->route('dashboard')->with(['type' => 'success', 'message' => "You are now working in {$store->name}."]);
    }

    private function validated(Request $request, ?Store $store = null): array
    {
        $request->merge(['short_code' => strtoupper(trim((string) $request->input('short_code')))]);

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'short_code' => ['required', 'string', 'regex:'.Store::SHORT_CODE_PATTERN, Rule::unique('stores', 'short_code')->ignore($store?->id)],
            'code' => ['nullable', 'string', 'max:60', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('stores', 'code')->ignore($store?->id)],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'code.regex' => 'Store code may only use small letters, numbers and dashes (e.g. kedai-kuantan).',
            'code.unique' => 'Another store already uses this code.',
            'short_code.required' => 'Enter a short code for document numbers (e.g. KTN).',
            'short_code.regex' => 'Short code must be 2–6 capital letters or numbers, starting with a letter (e.g. KTN).',
            'short_code.unique' => 'Another store already uses this short code.',
        ]);
    }
}
