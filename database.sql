-- database.sql
CREATE DATABASE cafe_management;

\c cafe_management;

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Menu items table
CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id),
    price DECIMAL(10,2) NOT NULL,
    availability BOOLEAN DEFAULT TRUE
);

-- Tables table
CREATE TABLE cafe_tables (
    table_id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available'
);

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES cafe_tables(table_id),
    user_id INTEGER REFERENCES users(user_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Order items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    item_id INTEGER REFERENCES menu_items(item_id),
    quantity INTEGER NOT NULL,
    item_price DECIMAL(10,2) NOT NULL
);

-- Insert sample data
INSERT INTO categories (category_name) VALUES 
('Coffee'), ('Tea'), ('Snacks'), ('Beverages');

INSERT INTO menu_items (item_name, category_id, price) VALUES
('Espresso', 1, 2.50),
('Cappuccino', 1, 3.50),
('Latte', 1, 3.50),
('Green Tea', 2, 2.00),
('Black Tea', 2, 1.50),
('Sandwich', 3, 4.50),
('Croissant', 3, 2.50),
('Orange Juice', 4, 3.00),
('Cold Coffee', 4, 3.50);

INSERT INTO cafe_tables (table_number, capacity) VALUES
(1, 4), (2, 4), (3, 2), (4, 6), (5, 2);

INSERT INTO users (username, password, full_name, role) VALUES
('admin', 'admin123', 'Admin User', 'admin'),
('staff1', 'staff123', 'John Doe', 'staff');