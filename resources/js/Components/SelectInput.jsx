import { forwardRef } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default forwardRef(function SelectInput(
    { 
        options = [], 
        placeholder = 'Sila pilih...', 
        onValueChange,
        value,
        className = '',
        ...props 
    },
    ref,
) {
    return (
        <Select onValueChange={onValueChange} value={value} {...props}>
            <SelectTrigger className={className} ref={ref}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem 
                        key={option.value} 
                        value={option.value}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});
