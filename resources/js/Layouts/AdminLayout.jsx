import { Head, Link, usePage } from '@inertiajs/react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
    { label: 'Stores', route: 'admin.dashboard' },
    { label: 'Users', route: 'admin.users.index' },
];

/** Master admin area: manage stores and who can use them. */
export default function AdminLayout({ title, children, actions }) {
    const { user } = usePage().props.auth;

    return (
        <div className="min-h-screen bg-muted/40">
            <Head title={`${title} · Master admin`} />
            <nav className="pt-safe sticky top-0 z-40 border-b bg-background">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-2 font-semibold">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="hidden sm:inline">Master admin</span>
                        </span>
                        <div className="flex gap-1">
                            {nav.map((item) => (
                                <Link
                                    key={item.route}
                                    href={route(item.route)}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium',
                                        route().current(item.route) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-muted-foreground md:inline">{user.name}</span>
                        <Link href={route('admin.logout')} method="post" as="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                            <LogOut className="h-4 w-4" />Log out
                        </Link>
                    </div>
                </div>
            </nav>
            <main className="mx-auto max-w-6xl space-y-4 px-4 pt-6 pb-safe sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    {actions}
                </div>
                {children}
            </main>
        </div>
    );
}
