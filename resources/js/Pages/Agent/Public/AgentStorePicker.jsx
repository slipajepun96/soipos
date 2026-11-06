import { ChevronRight, Store } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';
import { PublicShell } from '@/Components/preorders/PublicShell';

/** Shown on the old shared /agent/register link when there is more than one store. */
export default function AgentStorePicker({ stores }) {
    return (
        <PublicShell title="Agent registration" shop={{ name: 'Agent registration' }}>
            <div>
                <h1 className="text-lg font-semibold">Which store are you registering with?</h1>
                <p className="text-sm text-muted-foreground">Choose the store you will sell for.</p>
            </div>
            <Card>
                <CardContent className="divide-y p-0">
                    {stores.length === 0 && <p className="p-5 text-sm text-muted-foreground">No stores are open for registration.</p>}
                    {stores.map((s) => (
                        <a key={s.code} href={route('agent.register', s.code)} className="flex items-center gap-3 px-5 py-4 hover:bg-accent/50">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <span className="flex-1 font-medium">{s.name}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </a>
                    ))}
                </CardContent>
            </Card>
        </PublicShell>
    );
}
