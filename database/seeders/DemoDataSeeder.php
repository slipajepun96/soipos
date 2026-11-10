<?php

namespace Database\Seeders;

use App\Http\Controllers\JointEventController;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\SalesEvent;
use App\Models\SalesEventProduct;
use App\Models\Setting;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use App\Services\SaleService;
use App\Services\StockLedger;
use App\Support\CurrentStore;
use Illuminate\Database\Seeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Realistic demo data for every store: categories, suppliers, products (incl. a no-stock item
 * and a Bakul), stock received, ~45 days of POS sales, invoices, a past event and an open
 * joint event. Goes through the real sale / stock code so balances and numbers are consistent.
 *
 * Everything is tagged so it can be found again: product SKUs and supplier registration numbers
 * start with "DEMO-", sales notes start with "Demo data", events have notes "Demo data".
 *
 *   php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    private const DAYS = 45;

    /** Store catalogues by short code; any other store gets the general catalogue. */
    private const CATALOGUES = [
        'PSV' => [
            'categories' => ['Fresh Fruit', 'Jams & Spreads', 'Drinks', 'Souvenirs'],
            'suppliers' => [
                ['Ladang Strawberi Kea Farm', 'Kea Farm, 39007 Brinchang, Pahang', 'Encik Rosli', '013-555 2101'],
                ['Cameron Fresh Packers Sdn. Bhd.', 'Lot 12, Ringlet, 39200 Cameron Highlands', 'Ms. Tan', '05-491 2233'],
                ['Kraf Tanah Tinggi', 'Tanah Rata, 39000 Cameron Highlands', 'Puan Aini', '019-772 3410'],
            ],
            'products' => [
                // name, category, unit, size, price, cost, supplier, opening qty, daily demand
                ['Strawberi Segar', 'Fresh Fruit', 'Pack', 250, 12.00, 6.50, 0, 400, 9],
                ['Strawberi Segar Premium', 'Fresh Fruit', 'Box', 500, 25.00, 14.00, 0, 200, 4],
                ['Petik Sendiri Strawberi', 'Fresh Fruit', 'Kg', 1, 45.00, 0, null, 0, 3, 'none'],
                ['Jem Strawberi', 'Jams & Spreads', 'Bottle', 250, 15.00, 7.80, 1, 300, 6],
                ['Jem Strawberi Kurang Gula', 'Jams & Spreads', 'Bottle', 250, 17.00, 8.90, 1, 150, 2],
                ['Sos Cili Strawberi', 'Jams & Spreads', 'Bottle', 300, 13.00, 6.20, 1, 120, 2],
                ['Jus Strawberi', 'Drinks', 'Bottle', 350, 8.00, 3.50, 1, 400, 8],
                ['Milkshake Strawberi', 'Drinks', 'Cup', 400, 10.00, 4.00, null, 300, 7],
                ['Keychain Strawberi', 'Souvenirs', 'Piece', 1, 6.00, 2.20, 2, 300, 3],
                ['Fridge Magnet Cameron', 'Souvenirs', 'Piece', 1, 8.00, 3.00, 2, 200, 2],
                ['Pokok Strawberi Pasu', 'Souvenirs', 'Pot', 1, 20.00, 9.00, 0, 80, 1],
            ],
            'bakul' => ['Bakul Strawberi Cameron', 49.00, [['Strawberi Segar', 2], ['Jem Strawberi', 1], ['Jus Strawberi', 2]]],
        ],
        'default' => [
            'categories' => ['Sauces & Pastes', 'Snacks', 'Drinks', 'Honey & Health'],
            'suppliers' => [
                ['Kilang Sos Pahang Sdn. Bhd.', 'Kawasan Perindustrian Semambu, 25350 Kuantan', 'Encik Hafiz', '09-566 1290'],
                ['Usahawan Kerepek Temerloh', 'Jalan Bahagia, 28000 Temerloh, Pahang', 'Kak Ros', '012-910 4477'],
                ['Madu Kelulut Tasik Chini', 'Kampung Gumum, 26690 Pekan, Pahang', 'Encik Zul', '017-944 3021'],
            ],
            'products' => [
                ['Sos Cili Pahang', 'Sauces & Pastes', 'Bottle', 340, 7.50, 3.80, 0, 400, 7],
                ['Sambal Bilis Garing', 'Sauces & Pastes', 'Jar', 200, 12.00, 6.00, 0, 250, 4],
                ['Pes Rendang Tok', 'Sauces & Pastes', 'Pack', 250, 9.90, 4.50, 0, 200, 3],
                ['Kerepek Pisang Tanduk', 'Snacks', 'Pack', 200, 6.00, 2.80, 1, 500, 9],
                ['Kerepek Ubi Pedas', 'Snacks', 'Pack', 200, 6.00, 2.70, 1, 500, 8],
                ['Rempeyek Kacang', 'Snacks', 'Tub', 300, 10.00, 4.60, 1, 200, 3],
                ['Kopi Tenom Pahang', 'Drinks', 'Pack', 500, 18.00, 9.50, null, 150, 3],
                ['Air Nira Nipah', 'Drinks', 'Bottle', 500, 5.00, 2.00, null, 300, 6],
                ['Madu Kelulut Asli', 'Honey & Health', 'Bottle', 500, 55.00, 32.00, 2, 120, 2],
                ['Madu Tualang', 'Honey & Health', 'Bottle', 350, 45.00, 26.00, 2, 100, 1],
                ['Teh Misai Kucing', 'Honey & Health', 'Box', 20, 15.00, 7.00, 2, 150, 2],
            ],
            'bakul' => ['Bakul Cenderamata Pahang', 39.00, [['Sos Cili Pahang', 1], ['Kerepek Pisang Tanduk', 2], ['Kerepek Ubi Pedas', 1], ['Air Nira Nipah', 2]]],
        ],
    ];

    private const CUSTOMERS = [
        ['Kedai Runcit Pak Mat', 'Pak Mat Runcit Enterprise', '012-334 8812'],
        ['Hotel Seri Malaysia', 'Seri Malaysia Hotels Sdn. Bhd.', '09-517 3434'],
        ['Koperasi Guru Pahang', 'Koperasi Guru-Guru Pahang Bhd.', '09-513 2200'],
        ['Puan Siti Aminah', null, '019-223 4410'],
        ['Kafe Bukit Hijau', 'Bukit Hijau Trading', '013-998 1203'],
    ];

    private StockLedger $ledger;

    private SaleService $sales;

    public function run(): void
    {
        mt_srand(20261110); // same demo data on every run
        $this->ledger = app(StockLedger::class);
        $this->sales = app(SaleService::class);

        $user = User::where('is_master_admin', true)->first() ?? User::first();
        if (! $user) {
            $this->command->error('Create a user first.');

            return;
        }
        Auth::login($user);

        DB::transaction(fn () => $this->seedAll()); // all or nothing
    }

    private function seedAll(): void
    {
        $stores = Store::where('is_active', true)->orderBy('created_at')->get();
        $made = [];
        foreach ($stores as $store) {
            if (Product::withoutGlobalScope('store')->where('store_id', $store->id)->where('product_sku_code', 'like', 'DEMO-%')->exists()) {
                $this->command->warn("{$store->name}: demo data already there, skipped.");

                continue;
            }
            $made[$store->id] = CurrentStore::using($store->id, fn () => $this->seedStore($store));
            $this->command->info("{$store->name}: ".$made[$store->id]['summary']);
        }

        if (count($made) >= 2) {
            $this->seedJointEvent($stores->whereIn('id', array_keys($made))->values(), $made);
        }
    }

    /** One store's catalogue, stock and sales history. */
    private function seedStore(Store $store): array
    {
        $catalogue = self::CATALOGUES[$store->short_code] ?? self::CATALOGUES['default'];
        $code = $store->short_code ?: 'ST';

        // Settings: fill only what is still empty.
        $settings = Setting::store();
        Setting::setMany(array_filter([
            'company_name' => $settings['company_name'] ? null : $store->name.' Sdn. Bhd.',
            'phone' => $settings['phone'] ? null : '09-500 '.mt_rand(1000, 9999),
            'bank_name' => $settings['bank_name'] ? null : 'Maybank',
            'bank_account_no' => $settings['bank_account_no'] ? null : '5'.mt_rand(10000000000, 99999999999),
        ]));

        $categories = collect($catalogue['categories'])->mapWithKeys(fn ($name) => [$name => ProductCategory::firstOrCreate(
            ['product_categories_name' => $name],
            ['product_categories_sub_level' => '1'],
        )->id]);

        $suppliers = collect($catalogue['suppliers'])->values()->map(fn ($s, $i) => Supplier::create([
            'supplier_name' => $s[0],
            'supplier_address' => $s[1],
            'supplier_rob_num' => "DEMO-{$code}-".str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
            'supplier_contact_person' => $s[2],
            'supplier_phone_num' => $s[3],
        ]));

        // Products
        $products = collect();
        foreach ($catalogue['products'] as $i => $row) {
            [$name, $category, $unit, $size, $price, $cost, $supplier, $opening, $demand] = $row;
            $products[$name] = (object) [
                'model' => Product::create([
                    'product_category_id' => $categories[$category],
                    'product_name' => $name,
                    'product_unit' => $unit,
                    'product_num_of_measure' => $size,
                    'product_sku_code' => "DEMO-{$code}-".str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                    'product_code' => '955'.mt_rand(1000000000, 9999999999),
                    'product_price' => $price,
                    'product_supplier_id' => $supplier === null ? null : $suppliers[$supplier]->id,
                    'product_low_stock_limit' => (int) max(5, $demand * 3),
                    'track_stock' => ($row[9] ?? 'stock') !== 'none',
                ]),
                'cost' => $cost, 'opening' => $opening, 'demand' => $demand, 'supplier' => $supplier,
            ];
        }

        [$bakulName, $bakulPrice, $bakulItems] = $catalogue['bakul'];
        $bakul = Product::create([
            'product_category_id' => $categories[$catalogue['categories'][1]],
            'product_name' => $bakulName,
            'product_unit' => 'Bakul',
            'product_num_of_measure' => 1,
            'product_sku_code' => "DEMO-{$code}-B01",
            'product_price' => $bakulPrice,
            'product_low_stock_limit' => 0,
            'track_stock' => false,
            'is_bundle' => true,
        ]);
        foreach ($bakulItems as [$component, $qty]) {
            $bakul->bundleItems()->create(['component_product_id' => $products[$component]->model->id, 'quantity' => $qty]);
        }
        $products[$bakulName] = (object) ['model' => $bakul, 'demand' => 1, 'opening' => 0];

        // Stock: opening stock before the period, then a GRN per supplier half way through.
        $start = today()->subDays(self::DAYS + 2)->toDateString();
        $stocked = $products->filter(fn ($p) => $p->opening > 0);
        $this->ledger->createDocument('Opening Stock', $start, [], $stocked->map(fn ($p) => [
            'product' => $p->model, 'entry_type' => 'in', 'quantity' => $p->opening,
            'unit_cost' => $p->cost, 'total_cost' => round($p->opening * $p->cost, 2),
        ])->values()->all(), 'Demo data');

        $mid = today()->subDays((int) (self::DAYS / 2))->toDateString();
        foreach ($suppliers as $i => $supplier) {
            $lines = $stocked->filter(fn ($p) => $p->supplier === $i)->map(fn ($p) => [
                'product' => $p->model, 'entry_type' => 'in', 'quantity' => (int) ceil($p->opening * 0.6),
                'unit_cost' => round($p->cost * 1.03, 2), 'total_cost' => round(ceil($p->opening * 0.6) * $p->cost * 1.03, 2),
                'supplier_id' => $supplier->id,
            ])->values()->all();
            if ($lines) {
                $this->ledger->createDocument('GRN', $mid, [
                    'supplier_id' => $supplier->id, 'name' => $supplier->supplier_name, 'reference' => $supplier->supplier_rob_num,
                    'address' => $supplier->supplier_address, 'phone' => $supplier->supplier_phone_num,
                ], $lines, 'Demo data');
            }
        }

        // A past weekend event.
        $eventStart = today()->subDays(18);
        $event = SalesEvent::create([
            'name' => 'Karnival Agro Pahang', 'location' => 'Dataran Kuantan',
            'start_date' => $eventStart, 'end_date' => $eventStart->copy()->addDays(2),
            'status' => 'closed', 'notes' => 'Demo data', 'created_by' => Auth::user()->name,
        ]);

        // Sales history
        $count = 0;
        $invoices = 0;
        $sellable = $products->values();
        for ($d = self::DAYS; $d >= 0; $d--) {
            $date = today()->subDays($d);
            $atEvent = $date->betweenIncluded($event->start_date, $event->end_date);
            $weekend = $date->isWeekend();
            $receipts = mt_rand(3, 7) + ($weekend ? 4 : 0) + ($atEvent ? 10 : 0);

            for ($r = 0; $r < $receipts; $r++) {
                $items = $this->basket($sellable, mt_rand(1, $atEvent ? 4 : 3));
                $count += $this->sell($date, $items, [
                    'document_type' => 'receipt',
                    'sales_event_id' => $atEvent ? $event->id : null,
                    'payment_method' => $this->method(),
                    'discount' => mt_rand(1, 12) === 1 ? 2 : 0,
                ]);
            }

            // Wholesale invoices about twice a week: some paid, some pending, some overdue.
            if (mt_rand(1, 7) <= 2) {
                $customer = self::CUSTOMERS[array_rand(self::CUSTOMERS)];
                $items = $this->basket($sellable->filter(fn ($p) => $p->model->track_stock), mt_rand(2, 4), 6, 20);
                $mode = mt_rand(1, 3);
                $invoices += $this->sell($date, $items, [
                    'document_type' => 'invoice',
                    'customer_name' => $customer[0],
                    'customer_company' => $customer[1],
                    'customer_phone' => $customer[2],
                    'pay_later' => $mode !== 1,
                    'payment_method' => $mode === 1 ? 'Bank Transfer' : null,
                    'due_date' => $date->copy()->addDays(30)->toDateString(),
                ]);
            }
        }

        return [
            'products' => $products,
            'summary' => sprintf('%d products, %d suppliers, %d receipts, %d invoices, 1 event', $products->count(), $suppliers->count(), $count, $invoices),
        ];
    }

    /** Joint event: first store hosts, the others are partners, a few joint sales today. */
    private function seedJointEvent($stores, array $made): void
    {
        $host = $stores->first();
        CurrentStore::using($host->id, function () use ($host, $stores, $made) {
            $event = SalesEvent::create([
                'name' => 'Pesta Buah & Tani', 'location' => 'Taman Gelora, Kuantan',
                'start_date' => today()->subDay(), 'end_date' => today()->addDays(2),
                'status' => 'open', 'notes' => 'Demo data', 'created_by' => Auth::user()->name,
            ]);
            JointEventController::syncPartners($event, $stores->skip(1)->pluck('id')->all());
            $copies = $event->partners()->pluck('partner_event_id', 'partner_store_id')->put($host->id, $event->id);

            // Each store lists a few products at an event price.
            foreach ($stores as $store) {
                CurrentStore::using($store->id, function () use ($copies, $store, $made) {
                    $made[$store->id]['products']->filter(fn ($p) => ! $p->model->is_bundle)->take(6)
                        ->each(fn ($p) => SalesEventProduct::create([
                            'sales_event_id' => $copies[$store->id],
                            'product_id' => $p->model->id,
                            'price' => round($p->model->product_price * 0.9, 1),
                        ]));
                });
            }

            $listed = SalesEventProduct::withoutGlobalScope('store')->whereIn('sales_event_id', $copies->values())->get();
            $joint = app(JointEventController::class);
            for ($i = 0; $i < 8; $i++) {
                $items = $listed->random(mt_rand(2, 4))->map(fn ($l) => ['product_id' => $l->product_id, 'quantity' => mt_rand(1, 2), 'unit_price' => $l->price]);
                $method = $this->method();
                $total = $items->sum(fn ($i) => $i['quantity'] * $i['unit_price']);
                $joint->checkout(Request::create('/', 'POST', [
                    'items' => $items->values()->all(),
                    'payment_method' => $method,
                    'amount_tendered' => $method === 'Cash' ? ceil($total / 10) * 10 : null,
                ]), $event);
            }
            Sale::withoutGlobalScope('store')->where('notes', 'like', 'Joint sale at Pesta Buah%')->update(['notes' => DB::raw("CONCAT('Demo data · ', notes)")]);

            $this->command->info("Joint event \"{$event->name}\" hosted by {$host->name} with ".($stores->count() - 1).' partner(s), 8 joint sales.');
        });
    }

    /** Random products for one sale, weighted by how well each sells. */
    private function basket($products, int $lines, int $minQty = 1, int $maxQty = 3): array
    {
        $pool = $products->flatMap(fn ($p) => array_fill(0, max(1, $p->demand), $p))->shuffle();
        $picked = $pool->unique(fn ($p) => $p->model->id)->take($lines);

        return $picked->map(fn ($p) => [
            'product_id' => $p->model->id,
            'quantity' => mt_rand($minQty, $maxQty),
            'unit_price' => (float) $p->model->product_price,
        ])->values()->all();
    }

    /** Save a sale on a past date at a believable time; skips it when stock has run out. */
    private function sell($date, array $items, array $data): int
    {
        try {
            $sale = $this->sales->create(array_merge([
                'sale_date' => $date->toDateString(),
                'items' => $items,
                'notes' => 'Demo data',
                'pay_later' => false,
            ], $data));
        } catch (\Illuminate\Validation\ValidationException) {
            return 0; // ran out of something: just skip this sale
        }

        $at = $date->copy()->setTime(mt_rand(9, 20), mt_rand(0, 59), mt_rand(0, 59));
        if ($at->isFuture()) {
            $at = now()->subMinutes(mt_rand(1, 120));
        }
        DB::table('sales')->where('id', $sale->id)->update(['created_at' => $at, 'updated_at' => $at]);

        // Most paid-later invoices older than two weeks got a part payment.
        if ($sale->document_type === 'invoice' && $sale->balance_due > 0 && $date->diffInDays(today()) > 14 && mt_rand(1, 2) === 1) {
            $this->sales->addPayment($sale, [
                'payment_date' => $date->copy()->addDays(mt_rand(5, 12))->toDateString(),
                'method' => 'Bank Transfer',
                'amount' => round($sale->balance_due / 2, 2),
            ]);
        }

        return 1;
    }

    private function method(): string
    {
        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 45 => 'Cash',
            $roll <= 80 => 'E-Wallet',
            $roll <= 92 => 'Card',
            default => 'Bank Transfer',
        };
    }
}
