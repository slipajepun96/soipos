import { forwardRef } from 'react';

const PrimaryButton = forwardRef(({ className = '', disabled, children, ...props }, ref) => {
    return (
        <button
            {...props}
            ref={ref}
            className={
                `inline-flex items-center rounded-lg border border-transparent bg-blue-700 px-3 py-1.5 font-semibold text-white transition duration-150 ease-in-out hover:bg-blue-800 focus:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-900 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
});

PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;
