import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';

export default forwardRef(function FileInput(
    { 
        className = '', 
        onChange,
        accept = '*',
        maxSize = 5, // MB
        showPreview = true,
        ...props 
    },
    ref,
) {
    const localRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
        clear: () => {
            setSelectedFile(null);
            setPreview(null);
            setError('');
            if (localRef.current) {
                localRef.current.value = '';
            }
        },
    }));

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setError('');

        if (!file) {
            setSelectedFile(null);
            setPreview(null);
            return;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            setError(`Saiz fail melebihi had ${maxSize}MB`);
            setSelectedFile(null);
            setPreview(null);
            return;
        }

        setSelectedFile(file);

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }

        // Call parent onChange
        if (onChange) {
            onChange(e);
        }
    };

    const handleRemove = () => {
        setSelectedFile(null);
        setPreview(null);
        setError('');
        if (localRef.current) {
            localRef.current.value = '';
        }
        
        // Trigger onChange with empty file
        if (onChange) {
            const event = {
                target: {
                    files: [],
                    value: '',
                },
            };
            onChange(event);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            <div className="relative">
                <input
                    {...props}
                    type="file"
                    accept={accept}
                    className="hidden"
                    ref={localRef}
                    onChange={handleFileChange}
                />
                
                {!selectedFile ? (
                    <button
                        type="button"
                        onClick={() => localRef.current?.click()}
                        className={
                            'w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-indigo-500 hover:bg-gray-50 transition-colors ' +
                            className
                        }
                    >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            Klik untuk muat naik (Max {maxSize}MB)
                        </span>
                    </button>
                ) : (
                    <div className="border-2 border-gray-300 rounded-md p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {preview ? (
                                    <img 
                                        src={preview} 
                                        alt="Preview" 
                                        className="w-12 h-9 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-9 bg-gray-100 rounded flex items-center justify-center">
                                        <FileIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => localRef.current?.click()}
                                    className="px-3 py-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Tukar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            
            {accept && !selectedFile && (
                <p className="mt-1 text-xs text-gray-500">
                    Format yang diterima: {accept.replace(/\./g, '').toUpperCase()}
                </p>
            )}
        </div>
    );
});
