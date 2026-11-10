import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Boxes, CalendarDays, ChevronDown, ClipboardList, FileText, House, LogOut, Menu, Receipt, ShoppingCart, Store, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Home', route: 'dashboard', match: ['dashboard'], icon: House },
    { label: 'POS', route: 'sales.pos', match: ['sales.pos'], icon: ShoppingCart },
    { label: 'Sales', route: 'sales.index', match: ['sales.index'], icon: Receipt },
    { label: 'Pre-orders', route: 'preorders.index', match: ['preorders.*'], icon: ClipboardList },
    { label: 'Invoices', route: 'sales.invoices.index', match: ['sales.invoices.*'], icon: FileText },
    { label: 'Events', route: 'sales.events.index', match: ['sales.events.*'], icon: CalendarDays },
    { label: 'Inventory', route: 'inventory.index', match: ['inventory.*', 'product.*', 'productCategories.*', 'supplier.*'], icon: Boxes },
];

const isActive = (item) => item.match.some((pattern) => route().current(pattern));

export default function AuthenticatedLayout({ header, children }) {
    const { auth: { user }, store } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-muted/40">
            <nav className="pt-safe sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-foreground">
                            <ApplicationLogo />
                        </Link>
                        <div className="hidden items-center gap-1 xl:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={route(item.route)}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        isActive(item)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden xl:block">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                    <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                                        <span className="max-w-[12rem] truncate">{user.name}</span>
                                        {store && (
                                            <span className="flex max-w-[12rem] items-center gap-1 text-xs font-normal text-muted-foreground" title="Current store">
                                                <Store className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{store.name}</span>
                                            </span>
                                        )}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('settings.edit')}>Settings</Dropdown.Link>
                                <Dropdown.Link href={route('about')}>About</Dropdown.Link>
                                {user.is_master_admin && <Dropdown.Link href={route('admin.dashboard')}>Master admin</Dropdown.Link>}
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Log out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>

                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-md p-2 hover:bg-accent xl:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                    <div className="pt-safe pb-safe-bar fixed inset-y-0 left-0 flex w-full max-w-xs flex-col border-r bg-background shadow-xl">
                        <div className="flex h-14 items-center justify-between border-b px-4">
                            <ApplicationLogo />
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md p-2 hover:bg-accent"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3">
                            {navItems.map(({ icon: Icon, ...item }) => (
                                <Link
                                    key={item.label}
                                    href={route(item.route)}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-2 rounded-lg border px-2 py-4 text-sm font-medium transition-colors',
                                        isActive(item) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="border-t p-3">
                            <div className="px-3 py-2">
                                <div className="text-sm font-medium">{user.name}</div>
                                {store && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Store className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{store.name}</span>
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                            <Link
                                href={route('profile.edit')}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-md px-3 py-2.5 text-sm hover:bg-accent"
                            >
                                Profile
                            </Link>
                            <Link
                                href={route('settings.edit')}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-md px-3 py-2.5 text-sm hover:bg-accent"
                            >
                                Settings
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent"
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {header && (
                <header className="border-b bg-background">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 [&_h2]:text-foreground">
                        {header}
                    </div>
                </header>
            )}

            <main className="pb-safe">{children}</main>
        </div>
    );
}
