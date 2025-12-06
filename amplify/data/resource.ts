import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  /* ---------------------------
     BRANCHES
  ----------------------------*/
  Branch: a.model({
    name: a.string().required(),
    address: a.string(),
    // Relationships
    stocks: a.hasMany('ProductStock', 'branchId'),
    staff: a.hasMany('StaffProfile', 'branchId'),
    sales: a.hasMany('Sale', 'branchId'),
    batches: a.hasMany('ProductBatch', 'branchId'),
    purchaseOrders: a.hasMany('PurchaseOrder', 'branchId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     PRODUCTS (Updated with Unit/MinStock)
  ----------------------------*/
  Product: a.model({
    name: a.string().required(),
    myanmarName: a.string(),
    sku: a.string(),
    category: a.string(),
    price: a.float(),
    imageUrl: a.string(),
    
    // --- NEW FIELDS ---
    unit: a.string(),
    minStock: a.integer(),
    description: a.string(),
    // ------------------

    // Relationships
    batches: a.hasMany('ProductBatch', 'productId'),
    stocks: a.hasMany('ProductStock', 'productId'),
    purchaseItems: a.hasMany('PurchaseItem', 'productId'),
    saleItems: a.hasMany('SaleItem', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  ProductBatch: a.model({
    batchNumber: a.string(),
    expiryDate: a.date(),
    quantity: a.integer(),
    costPrice: a.float(),
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     STOCK PER BRANCH
  ----------------------------*/
  ProductStock: a.model({
    currentStock: a.integer(),
    productId: a.id().required(),
    product: a.belongsTo('Product', 'productId'),
    branchId: a.id().required(),
    branch: a.belongsTo('Branch', 'branchId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     SUPPLIERS & POs
  ----------------------------*/
  Supplier: a.model({
    name: a.string(),
    phone: a.string(),
    contactPerson: a.string(),
    outstandingBalance: a.float(),
    purchaseOrders: a.hasMany('PurchaseOrder', 'supplierId'),
  }).authorization(allow => [allow.publicApiKey()]),

  PurchaseOrder: a.model({
    poNumber: a.string(),
    status: a.enum(['PENDING', 'RECEIVED']),
    paymentType: a.enum(['CASH', 'CREDIT']),
    orderDate: a.date(),
    totalCost: a.float(),
    supplierId: a.id(),
    supplier: a.belongsTo('Supplier', 'supplierId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
    items: a.hasMany('PurchaseItem', 'poId'),
  }).authorization(allow => [allow.publicApiKey()]),

  PurchaseItem: a.model({
    quantity: a.integer(),
    costPrice: a.float(),
    poId: a.id(),
    purchaseOrder: a.belongsTo('PurchaseOrder', 'poId'),
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     CUSTOMERS & SALES
  ----------------------------*/
  Customer: a.model({
    name: a.string(),
    phone: a.string(),
    points: a.integer(),
    sales: a.hasMany('Sale', 'customerId'),
  }).authorization(allow => [allow.publicApiKey()]),

  Sale: a.model({
    invoiceNumber: a.string(),
    totalAmount: a.float(),
    soldAt: a.datetime(),
    paymentMethod: a.enum(['CASH', 'KBZPAY', 'WAVEPAY']),
    customerId: a.id(),
    customer: a.belongsTo('Customer', 'customerId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
    items: a.hasMany('SaleItem', 'saleId'),
  }).authorization(allow => [allow.publicApiKey()]),

  SaleItem: a.model({
    quantity: a.integer(),
    priceAtSale: a.float(),
    saleId: a.id(),
    sale: a.belongsTo('Sale', 'saleId'),
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     STAFF
  ----------------------------*/
  StaffProfile: a.model({
    email: a.string(),
    fullName: a.string(),
    role: a.enum(['ADMIN', 'STAFF']),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
  }).authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});