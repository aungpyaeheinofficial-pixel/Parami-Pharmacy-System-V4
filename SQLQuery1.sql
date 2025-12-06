CREATE TABLE branches (
    branch_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NULL
);
GO

/* ---------------------------
   PRODUCTS
----------------------------*/
CREATE TABLE products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    myanmar_name VARCHAR(255),
    sku VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    price DECIMAL(10,2),
    image_url VARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

/* ---------------------------
   PRODUCT BATCHES
----------------------------*/
CREATE TABLE product_batches (
    batch_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    quantity INT NOT NULL,
    cost_price DECIMAL(10,2),
    branch_id INT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
GO

/* ---------------------------
   STOCK PER BRANCH
----------------------------*/
CREATE TABLE product_stock (
    stock_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    branch_id INT NOT NULL,
    stock_quantity INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
GO

/* ---------------------------
   SUPPLIERS
----------------------------*/
CREATE TABLE suppliers (
    supplier_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    outstanding_balance DECIMAL(12,2) DEFAULT 0
);
GO

/* ---------------------------
   PURCHASE ORDERS
----------------------------*/
CREATE TABLE purchase_orders (
    po_id INT IDENTITY(1,1) PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE,
    supplier_id INT,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'RECEIVED')),
    payment_type VARCHAR(20) CHECK (payment_type IN ('CASH','CREDIT')),
    order_date DATE,
    total_cost DECIMAL(12,2),
    branch_id INT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
GO

/* ---------------------------
   PURCHASE ITEMS
----------------------------*/
CREATE TABLE purchase_items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    po_id INT,
    product_id INT,
    quantity INT,
    cost_price DECIMAL(10,2),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
GO

/* ---------------------------
   FINANCE TRANSACTIONS
----------------------------*/
CREATE TABLE finance_transactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    type VARCHAR(10) CHECK (type IN ('INCOME','EXPENSE')),
    category VARCHAR(100),
    description VARCHAR(MAX),
    amount DECIMAL(12,2),
    status VARCHAR(20) CHECK (status IN ('PAID','PENDING')),
    date DATE,
    branch_id INT,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
GO

/* ---------------------------
   ACCOUNTS PAYABLE
----------------------------*/
CREATE TABLE payables (
    payable_id INT IDENTITY(1,1) PRIMARY KEY,
    invoice_ref VARCHAR(50),
    supplier_id INT,
    due_date DATE,
    status VARCHAR(20) CHECK (status IN ('DUE SOON','PAID','OVERDUE')),
    amount_due DECIMAL(12,2),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);
GO

/* ---------------------------
   LOYALTY TIERS
----------------------------*/
CREATE TABLE loyalty_tiers (
    tier_id INT IDENTITY(1,1) PRIMARY KEY,
    tier_name VARCHAR(50),
    min_points INT
);
GO

/* ---------------------------
   CUSTOMERS
----------------------------*/
CREATE TABLE customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    tier_id INT,
    points INT DEFAULT 0,
    FOREIGN KEY (tier_id) REFERENCES loyalty_tiers(tier_id)
);
GO

/* ---------------------------
   ACCOUNTS RECEIVABLE
----------------------------*/
CREATE TABLE receivables (
    receivable_id INT IDENTITY(1,1) PRIMARY KEY,
    order_ref VARCHAR(50),
    customer_id INT,
    due_date DATE,
    status VARCHAR(20) CHECK (status IN ('NORMAL','LATE')),
    amount_due DECIMAL(12,2),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
GO

/* ---------------------------
   USERS
----------------------------*/
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('ADMIN','STAFF')),
    branch_id INT,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
GO