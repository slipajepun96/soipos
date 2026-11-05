import { useEffect, useMemo, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
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
} from "@/Components/ui/select";
import { useForm } from '@inertiajs/react';

export default function EditProductCategories({ product_category, product_categories }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id: product_category.id || '',
        product_categories_name: product_category.product_categories_name || '',
        product_categories_sub_level: product_category.product_categories_sub_level?.toString() || '',
        product_categories_parent_uuid: product_category.product_categories_parent_uuid || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const sortedCategories = useMemo(() => {
        if (!product_categories || product_categories.length === 0) {
            return [];
        }

        const categoriesExceptCurrent = product_categories.filter(
            (category) => category.id !== product_category.id,
        );

        const validCategories = categoriesExceptCurrent.filter((category) =>
            category.product_categories_sub_level == 1 || category.product_categories_sub_level == 2,
        );

        const parents = validCategories.filter((cat) => cat.product_categories_sub_level == 1);
        const children = validCategories.filter((cat) => cat.product_categories_sub_level == 2);
        const ordered = [];

        parents
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach((parent) => {
                ordered.push(parent);

                children
                    .filter((child) => child.product_categories_parent_uuid === parent.id)
                    .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
                    .forEach((child) => {
                        ordered.push(child);
                    });
            });

        const orphanedChildren = children.filter(
            (child) => !parents.some((parent) => parent.id === child.product_categories_parent_uuid),
        );

        orphanedChildren
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach((child) => {
                ordered.push(child);
            });

        return ordered;
    }, [product_categories, product_category.id]);

    useEffect(() => {
        setData({
            id: product_category.id,
            product_categories_name: product_category.product_categories_name || '',
            product_categories_sub_level: product_category.product_categories_sub_level?.toString() || '',
            product_categories_parent_uuid: product_category.product_categories_parent_uuid || '',
        });
    }, [product_category, setData]);

    const submit = (e) => {
        e.preventDefault();

        post(route('productCategory.updateProductCategory'), {
            onSuccess: () => {
                setIsDialogOpen(false);
            },
        });
    };

    const handleLevelChange = (value) => {
        setData('product_categories_sub_level', value);

        if (value === '1') {
            setData('product_categories_parent_uuid', '');
        }
    };

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset();
        }
    };

    const requiresParent = data.product_categories_sub_level === '2' || data.product_categories_sub_level === '3';

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline">Edit</PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Product Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="items-center space-y-2">
                        <div className="grid flex-1 gap-2">
                            <div>
                                <InputLabel
                                    htmlFor="product_categories_name"
                                    value={
                                        <>
                                            Name of Product Category <span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_categories_name"
                                    name="product_categories_name"
                                    value={data.product_categories_name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) => setData('product_categories_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.product_categories_name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_categories_sub_level"
                                    value={
                                        <>
                                            Level Of Category <span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <Select value={data.product_categories_sub_level} onValueChange={handleLevelChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Level Of Category" />
                                    </SelectTrigger>
                                    <SelectContent id="product_categories_sub_level" name="product_categories_sub_level">
                                        <SelectItem value="1">Main Level</SelectItem>
                                        <SelectItem value="2">Sub Level</SelectItem>
                                        <SelectItem value="3">Low Level</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_categories_sub_level} className="mt-2" />
                            </div>
                            <div className={requiresParent ? 'block' : 'hidden'}>
                                <InputLabel
                                    htmlFor="product_categories_parent_uuid"
                                    value={
                                        <>
                                            Parent of Product Category <span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <Select
                                    value={data.product_categories_parent_uuid || undefined}
                                    onValueChange={(value) => setData('product_categories_parent_uuid', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Parent of Product Category" />
                                    </SelectTrigger>
                                    <SelectContent id="product_categories_parent_uuid" name="product_categories_parent_uuid">
                                        {sortedCategories.length > 0 ? (
                                            sortedCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.product_categories_sub_level == 2 ? '└─ ' : ''}
                                                    {category.product_categories_name}
                                                    <span className="ml-2 text-gray-500">
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
                                <InputError message={errors.product_categories_parent_uuid} className="mt-2" />
                            </div>
                        </div>
                        <PrimaryButton disabled={processing}>Update Product Category</PrimaryButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
