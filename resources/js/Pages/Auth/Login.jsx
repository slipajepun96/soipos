import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div className=" flex flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                    <div className=" w-full max-w-2xl md:px-2 lg:max-w-7xl ">
                        <main className="mt-6">
                            <section class="bg-gray-50 ">
                                <div class="md:py-2 md:px-4 md:mx-auto max-w-screen-xl lg:py-16 grid lg:grid-cols-2 md:gap-8 lg:gap-16">
                                {/* <div class="py-8 px-4 mx-auto max-w-screen-xl grid gap-8 "> */}
                                    <div class="flex flex-col justify-center">
                                        <h1 class="md:mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl">SoiPOS</h1>
                                        <p class="mb-6 text-lg font-normal text-gray-500 lg:text-xl">v.0.1</p>
                                    </div>
                                    <div>
                                        <div class="w-full lg:max-w-2xl space-y-8 sm:p-2 md:p-8 md:bg-white md:rounded-lg md:shadow-xl">
                                            <h2 class="text-2xl font-bold text-gray-900">
                                                Login
                                            </h2>
                                            <form class="mt-8 space-y-6" action="#" onSubmit={submit}>
                                                <div>
                                                    <InputLabel htmlFor="email" value="Email" />

                                                    <TextInput
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className="mt-1 block w-full"
                                                        autoComplete="username"
                                                        isFocused={true}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                    />

                                                    <InputError message={errors.email} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="password" value="Password" />

                                                    <TextInput
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={data.password}
                                                        className="mt-1 block w-full"
                                                        autoComplete="current-password"
                                                        onChange={(e) => setData('password', e.target.value)}
                                                    />

                                                    <InputError message={errors.password} className="mt-2" />
                                                </div>
                                                <div class="flex items-start">
                                                    <div className="mt-4 block">
                                                        <label className="flex items-center">
                                                            <Checkbox
                                                                name="remember"
                                                                checked={data.remember}
                                                                onChange={(e) =>
                                                                    setData('remember', e.target.checked)
                                                                }
                                                            />
                                                            <span className="ms-2 text-sm text-gray-600">
                                                                Remember me
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {/* <a href="#" class="ms-auto text-sm font-medium text-blue-600 hover:underline ">Lost Password?</a> */}
                                                </div>
                                                <div className="mt-4 flex items-center justify-end">
                                                    {canResetPassword && (
                                                        <Link
                                                            href={route('password.request')}
                                                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        >
                                                            Forgot your password?
                                                        </Link>
                                                    )}

                                                    <PrimaryButton className="ms-4" disabled={processing}>
                                                        Login
                                                    </PrimaryButton>
                                                </div>
                                                {/* <button type="submit" class="w-full px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 sm:w-auto ">Login to your account</button> */}
                                                {/* <div class="text-sm font-medium text-gray-900">
                                                    Not registered yet? <a class="text-blue-600 hover:underline">Create account</a>
                                                </div> */}
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </main>
                    </div>
                </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form> */}
        </GuestLayout>
    );
}
