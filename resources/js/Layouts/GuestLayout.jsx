import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="md:flex px-6 md:px-0 min-h-screen md:flex-col items-center bg-gray-50 md:pt-6 sm:justify-center ">
            {/* <div> */}
                {/* <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                </Link> */}
            {/* </div> */}

            {/* <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg"> */}
                {children}
            {/* </div> */}
        </div>
    );
}
