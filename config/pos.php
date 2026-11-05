<?php

// Default store details. The Settings page overrides these; .env can change the defaults.
return [
    'store_name' => env('POS_STORE_NAME', 'Unit Pemasaran'),
    'company_name' => env('POS_COMPANY_NAME', 'PKPP Agro Sdn. Bhd.'),
    'company_reg_no' => env('POS_COMPANY_REG_NO', '199401040896 (326583-U)'),
    'address' => env('POS_ADDRESS', 'A-7, Kilang IKS PKPP, Kawasan Perindustrian PPD Sg. Soi, 25150 Kuantan, Pahang'),
    'phone' => env('POS_PHONE', '011-2663 7117'),
    'email' => env('POS_EMAIL', 'marketing@pkppagro.com.my'),
    'receipt_footer' => env('POS_RECEIPT_FOOTER', 'Thank you. Please come again.'),
];
