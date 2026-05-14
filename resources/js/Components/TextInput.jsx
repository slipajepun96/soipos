import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, formatNumber = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const formatWithCommas = (value) => {
        if (!value) return '';
        const numericValue = value.toString().replace(/[^\d.]/g, '');
        const parts = numericValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleChange = (e) => {
        if (formatNumber) {
            const rawValue = e.target.value.replace(/,/g, '');
            const formattedValue = formatWithCommas(rawValue);
            e.target.value = formattedValue;
            
            if (props.onChange) {
                const numericEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        value: rawValue,
                        name: e.target.name,
                    },
                };
                props.onChange(numericEvent);
            }
        } else {
            props.onChange?.(e);
        }
    };

    const displayValue = formatNumber && props.value ? formatWithCommas(props.value) : props.value;


    return (
        <input
            {...props}
            type={type} 
            className={
                'h-9 text-sm font-normal rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                className
            }
            ref={localRef}
            value={displayValue}
            onChange={handleChange}
        />
    );
});
