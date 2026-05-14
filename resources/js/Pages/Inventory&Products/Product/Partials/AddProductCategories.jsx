// import { Inertia } from '@inertiajs/inertia'; 
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"
import { useForm } from '@inertiajs/react';
// import { Input } from '@/Components/ui/input';
// import { Label } from '@/Components/ui/label';


export default function AddProductCategories({ product_categories }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        product_categories_name: '',
        product_categories_sub_level: '',
        product_categories_parent_uuid: '',
    });

    console.log('product_categories:', product_categories);
    
    const getSortedCategories = () => {
        if (!product_categories || product_categories.length === 0) {
            return [];
        }

        // Filter only level 1 and 2 categories
        const validCategories = product_categories.filter((category) =>
            category.product_categories_sub_level == 1 || 
            category.product_categories_sub_level == 2
        );

        // Separate parents (level 1) and children (level 2)
        const parents = validCategories.filter(cat => cat.product_categories_sub_level == 1);
        const children = validCategories.filter(cat => cat.product_categories_sub_level == 2);

        // Build sorted hierarchical list
        const sortedCategories = [];

        // First, add all parents sorted by name
        parents
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach(parent => {
                // Add parent
                sortedCategories.push(parent);
                
                // Add children of this parent, sorted by name
                children
                    .filter(child => child.product_categories_parent_uuid === parent.uuid)
                    .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
                    .forEach(child => {
                        sortedCategories.push(child);
                    });
            });

        // Add orphaned level 2 categories (those without a valid parent)
        const orphanedChildren = children.filter(child => 
            !parents.some(parent => parent.uuid === child.product_categories_parent_uuid)
        );
        orphanedChildren
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach(child => {
                sortedCategories.push(child);
            });

        return sortedCategories;
    };

    const sortedCategories = getSortedCategories();
    console.log('sorted categories:', sortedCategories);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const submit = (e) => {
        console.log('Submitting data:', data);
        e.preventDefault();

        post(route('productCategory.saveProductCategory'), {
            onSuccess: () => {
                reset(
                    'product_categories_name',
                    'product_categories_sub_level',
                    'product_categories_parent_uuid',
                );
                // Close the dialog
                console.log('Product Category saved successfully');
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Error saving product category:', errors);
            }
        });
    };
    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset(
                    'product_categories_name',
                    'product_categories_sub_level',
                    'product_categories_parent_uuid',
            );
        }
    };
    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline" className=''>
                    Add New Product Category
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Product Category</DialogTitle>
                    {/* <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription> */}
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="items-center space-y-2">
                        <div className="grid flex-1 gap-2">
                            <div>
                                <InputLabel
                                    htmlFor="product_categories_name"
                                    value={
                                        <>
                                            Name of Product Category <span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_categories_name"
                                    name="product_categories_name"
                                    value={data.product_categories_name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData('product_categories_name', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.product_categories_name}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_categories_sub_level"
                                    value={
                                    <>
                                        Level Of Category <span className="text-red-500">*</span>
                                    </>
                                }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_categories_sub_level', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Level Of Category" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        id="product_categories_sub_level"
                                        name="product_categories_sub_level"
                                    >
                                        <SelectItem value="1">Main Level</SelectItem>
                                        <SelectItem value="2">Sub Level</SelectItem>
                                        <SelectItem value="3">Low Level</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.product_categories_sub_level}
                                    className="mt-2"
                                />
                            </div>
                            <div className={data.product_categories_sub_level === "2" || data.product_categories_sub_level === "3" ? ('block') : ('hidden')}>
                                <InputLabel
                                    htmlFor="product_categories_parent_uuid"
                                    value={
                                    <>
                                        Parent of Product Category<span className="text-red-500">*</span>
                                    </>
                                }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_categories_parent_uuid', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Parent of Product Category" />
                                    </SelectTrigger>

                                    <SelectContent
                                        id="product_categories_parent_uuid"
                                        name="product_categories_parent_uuid"
                                    >
                                        {sortedCategories && sortedCategories.length > 0 ? (
                                            sortedCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.product_categories_sub_level == 2 ? '└─ ' : ''}
                                                    {category.product_categories_name}
                                                    <span className="text-gray-500 ml-2">
                                                        (Level {category.product_categories_sub_level})
                                                    </span>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-categories" disabled>
                                                No categories available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.product_categories_parent_uuid}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <PrimaryButton disabled={processing}>
                            Save Product Category
                        </PrimaryButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
