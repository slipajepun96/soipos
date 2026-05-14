import { forwardRef } from 'react';

export default forwardRef(function RadioGroup(
    { 
        options = [], 
        name,
        value,
        onChange,
        columns = 4,
        className = '',
        ...props 
    },
    ref,
) {
    const gridColsClass = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
        6: 'md:grid-cols-6',
        7: 'md:grid-cols-7',
    };

    return (
        <ul className={`grid w-full gap-2 ${gridColsClass[columns] || 'md:grid-cols-4'} ${className}`}>
            {options.map((option) => (
                <li key={option.value}>
                    <input 
                        type="radio" 
                        id={`${name}_${option.value}`}
                        value={option.value} 
                        name={name} 
                        className="hidden peer"
                        checked={value === option.value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        ref={ref}
                        {...props}
                    />
                    <label 
                        htmlFor={`${name}_${option.value}`}
                        className="inline-flex items-center justify-center w-full p-5 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-500 peer-checked:text-white hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >                           
                        <div className="block">
                            <div className="w-full text-md font-semibold">
                                {option.label}
                            </div>
                        </div>
                    </label>
                </li>
            ))}
        </ul>
    );
});
