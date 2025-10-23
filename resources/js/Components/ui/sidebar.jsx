import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const SidebarContext = createContext();

export function SidebarProvider({ children, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isMobile, setIsMobile] = useState(false);
    
    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile, setIsMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}

export function Sidebar({ 
    side = "left", 
    variant = "sidebar", 
    collapsible = "default",
    className, 
    children, 
    ...props 
}) {
    const { isOpen, isMobile } = useSidebar();
    
    return (
        <div
            className={cn(
                "relative flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
                !isOpen && collapsible === "icon" && "w-16",
                !isOpen && collapsible === "default" && "w-0 md:w-16",
                side === "right" && "border-l border-r-0",
                variant === "floating" && "m-2 rounded-lg border shadow-lg",
                variant === "inset" && "border-none shadow-none",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarHeader({ className, children, ...props }) {
    return (
        <div
            className={cn("flex h-16 shrink-0 items-center border-b border-sidebar-border px-4", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarContent({ className, children, ...props }) {
    return (
        <div
            className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarFooter({ className, children, ...props }) {
    return (
        <div
            className={cn("flex shrink-0 flex-col gap-2 border-t border-sidebar-border p-2", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarGroup({ className, children, ...props }) {
    return (
        <div
            className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarGroupLabel({ 
    className, 
    children, 
    asChild = false,
    ...props 
}) {
    const Component = asChild ? 'div' : 'div';
    
    return (
        <Component
            className={cn(
                "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export function SidebarGroupContent({ className, children, ...props }) {
    return (
        <div
            className={cn("w-full text-sm", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function SidebarMenu({ className, children, ...props }) {
    return (
        <ul
            className={cn("flex w-full min-w-0 flex-col gap-1", className)}
            {...props}
        >
            {children}
        </ul>
    );
}

export function SidebarMenuItem({ className, children, ...props }) {
    return (
        <li
            className={cn("group/menu-item relative", className)}
            {...props}
        >
            {children}
        </li>
    );
}

export function SidebarMenuButton({ 
    className, 
    children, 
    active = false, 
    asChild = false,
    size = "default",
    tooltip,
    ...props 
}) {
    const { isOpen } = useSidebar();
    
    const Component = asChild ? 'div' : 'button';
    
    return (
        <Component
            className={cn(
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "lg" && "p-3 text-sm",
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export function SidebarMenuSubItem({ className, children, ...props }) {
    return (
        <li
            className={cn("", className)}
            {...props}
        >
            {children}
        </li>
    );
}

export function SidebarMenuSubButton({ 
    className, 
    children, 
    active = false, 
    asChild = false,
    size = "default",
    ...props 
}) {
    const Component = asChild ? 'div' : 'button';
    
    return (
        <Component
            className={cn(
                "flex h-8 min-w-0 translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export function SidebarMenuSub({ className, children, ...props }) {
    return (
        <ul
            className={cn(
                "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
                className
            )}
            {...props}
        >
            {children}
        </ul>
    );
}

export function SidebarSeparator({ className, ...props }) {
    return (
        <hr
            className={cn("mx-2 w-auto border-sidebar-border", className)}
            {...props}
        />
    );
}

export function SidebarTrigger({ className, ...props }) {
    const { isOpen, setIsOpen } = useSidebar();
    
    return (
        <button
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            onClick={() => setIsOpen(!isOpen)}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 9 3 3-3 3" />
            </svg>
            <span className="sr-only">Toggle Sidebar</span>
        </button>
    );
}

export function SidebarInset({ className, children, ...props }) {
    return (
        <main
            className={cn(
                "relative flex min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
                className
            )}
            {...props}
        >
            {children}
        </main>
    );
}

export function SidebarInput({ className, ...props }) {
    return (
        <input
            data-sidebar="input"
            className={cn(
                "flex h-8 w-full rounded-md border border-sidebar-border bg-background px-3 py-1 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-sidebar-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}