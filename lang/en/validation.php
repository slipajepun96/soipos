<?php

// Merged over Laravel's built-in messages: only what this app changes.
// Stock is counted in whole units (a product's size, e.g. 500 ml, is just its name).
return [
    'custom' => [
        'product_image' => [
            'image' => 'The product photo must be a picture (JPG, PNG, WebP or GIF).',
            'mimes' => 'The product photo must be JPG, PNG, WebP or GIF. iPhone HEIC photos: set Camera > Formats to "Most Compatible", or take a screenshot of the photo.',
            'max' => 'The product photo is too large (maximum 5 MB).',
            'uploaded' => 'The product photo could not be uploaded. It may be too large for the server.',
        ],
        'items.*.quantity' => [
            'integer' => 'Quantity must be a whole number of units.',
            'min' => 'Quantity must be at least 1 unit.',
        ],
        'items.*.counted_quantity' => [
            'integer' => 'Counted quantity must be a whole number of units.',
        ],
        'items.*.unit_quantity' => [
            'integer' => 'Units per item must be a whole number.',
            'min' => 'Units per item must be at least 1.',
        ],
    ],
    'attributes' => [
        'product_image' => 'product photo',
        'items.*.quantity' => 'quantity',
        'items.*.counted_quantity' => 'counted quantity',
    ],
];
