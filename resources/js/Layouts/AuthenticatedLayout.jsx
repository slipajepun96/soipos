import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-gray-900 text-gray-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-50" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Sales
                                </NavLink>
                                <NavLink
                                    href={route('inventory.index')}
                                    active={route().current('inventory.index')}
                                    className='text-white'
                                >
                                    Inventory
                                </NavLink>
                                <NavLink
                                    href={route('supplier.index')}
                                    active={route().current('supplier.index')}
                                >
                                    Supplier
                                </NavLink>
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Report
                                </NavLink>
                                <NavLink
                                    href={route('agent.index')}
                                    active={route().current('agent.index')}
                                >
                                    Agent
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium leading-4 text-gray-50 transition duration-150 ease-in-out hover:text-gray-100 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className='text-lg'
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('about')}
                                            className='text-lg'
                                        >
                                            About
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-50 transition duration-150 ease-in-out hover:bg-gray-800 hover:text-gray-50 focus:bg-gray-800 focus:text-gray-50 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile sidebar overlay */}
                {showingNavigationDropdown && (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                            onClick={() => setShowingNavigationDropdown(false)}
                        />
                        
                        {/* Sidebar */}
                        <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out transform">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                                <Link href="/" onClick={() => setShowingNavigationDropdown(false)}>
                                    <ApplicationLogo className="block h-8 w-auto fill-current text-gray-50" />
                                </Link>
                                <button
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-md"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div className="px-4 py-6 space-y-2">
                                <ResponsiveNavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                >
                                    Sales
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('inventory.index')}
                                    active={route().current('inventory.index')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                >
                                    Inventory
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('supplier.index')}
                                    active={route().current('supplier.index')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                >
                                    Supplier
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                >
                                    Report
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('agent.index')}
                                    active={route().current('agent.index')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                >
                                    Agent
                                </ResponsiveNavLink>
                            </div>

                            {/* User Profile Section */}
                            <div className="border-t border-gray-700 px-4 py-6">
                                <div className="mb-4">
                                    <div className="text-base font-medium text-gray-100">
                                        {user.name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {user.email}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <ResponsiveNavLink 
                                        href={route('profile.edit')} 
                                        onClick={() => setShowingNavigationDropdown(false)}
                                        className="text-gray-100 hover:bg-gray-800 rounded-lg px-3 py-3 block"
                                    >
                                        Profile
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        method="post"
                                        href={route('logout')}
                                        as="button"
                                        onClick={() => setShowingNavigationDropdown(false)}
                                        className="text-red-400 hover:bg-gray-800 rounded-lg px-3 py-3 block w-full text-left"
                                    >
                                        Log Out
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
