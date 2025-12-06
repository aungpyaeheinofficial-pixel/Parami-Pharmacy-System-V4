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
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     PRODUCTS & BATCHES
  ----------------------------*/
  Product: a.model({
    name: a.string().required(),
    myanmarName: a.string(),
    sku: a.string(), // Unique logic is handled in code or constraints
    category: a.string(),
    price: a.float(),
    imageUrl: a.string(),
    // Relationships
    batches: a.hasMany('ProductBatch', 'productId'),
    stocks: a.hasMany('ProductStock', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  ProductBatch: a.model({
    batchNumber: a.string(),
    expiryDate: a.date(),
    quantity: a.integer(),
    costPrice: a.float(),
    // Relationships
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'), // Knowing which branch holds this batch
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     STOCK PER BRANCH
  ----------------------------*/
  ProductStock: a.model({
    currentStock: a.integer(),
    // Relationships
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
    // Relationships
    supplierId: a.id(),
    supplier: a.belongsTo('Supplier', 'supplierId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
    items: a.hasMany('PurchaseItem', 'poId'),
  }).authorization(allow => [allow.publicApiKey()]),

  PurchaseItem: a.model({
    quantity: a.integer(),
    costPrice: a.float(),
    // Relationships
    poId: a.id(),
    purchaseOrder: a.belongsTo('PurchaseOrder', 'poId'),
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     CUSTOMERS & LOYALTY
  ----------------------------*/
  Customer: a.model({
    name: a.string(),
    phone: a.string(),
    points: a.integer(),
    // Relationships
    sales: a.hasMany('Sale', 'customerId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     SALES (Added this for you)
  ----------------------------*/
  Sale: a.model({
    invoiceNumber: a.string(),
    totalAmount: a.float(),
    soldAt: a.datetime(),
    paymentMethod: a.enum(['CASH', 'KBZPAY', 'WAVEPAY']),
    // Relationships
    customerId: a.id(),
    customer: a.belongsTo('Customer', 'customerId'),
    branchId: a.id(),
    branch: a.belongsTo('Branch', 'branchId'),
    items: a.hasMany('SaleItem', 'saleId'),
  }).authorization(allow => [allow.publicApiKey()]),

  SaleItem: a.model({
    quantity: a.integer(),
    priceAtSale: a.float(),
    // Relationships
    saleId: a.id(),
    sale: a.belongsTo('Sale', 'saleId'),
    productId: a.id(),
    product: a.belongsTo('Product', 'productId'),
  }).authorization(allow => [allow.publicApiKey()]),

  /* ---------------------------
     STAFF PROFILE (Replaces Users Table)
  ----------------------------*/
  StaffProfile: a.model({
    email: a.string(), // Links to Cognito
    fullName: a.string(),
    role: a.enum(['ADMIN', 'STAFF']),
    // Relationships
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