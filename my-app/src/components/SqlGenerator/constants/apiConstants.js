export const DEFAULT_ENDPOINTS = {
  LM_STUDIO: 'http://localhost:1234/v1/chat/completions',
  OLLAMA: 'http://localhost:11434/api/chat',
  CUSTOM: ''
};

export const DEFAULT_MODELS = {
  OLLAMA: 'llama3'
};

export const DEMO_SCHEMAS = [
  {
    name: 'E-commerce Database',
    schema: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_per_item DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`
  },
  {
    name: 'Employee Management System',
    schema: `CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  budget DECIMAL(15, 2),
  manager_id INT
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  hire_date DATE NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  department_id INT NOT NULL,
  manager_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

ALTER TABLE departments
ADD CONSTRAINT fk_manager
FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE projects (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'Planning'
);

CREATE TABLE employee_projects (
  employee_id INT,
  project_id INT,
  role VARCHAR(50) NOT NULL,
  hours_allocated INT DEFAULT 0,
  PRIMARY KEY (employee_id, project_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE salaries (
  id INT PRIMARY KEY,
  employee_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);`
  },
  {
    name: 'Library Management System',
    schema: `CREATE TABLE authors (
  id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  birth_date DATE,
  nationality VARCHAR(50),
  biography TEXT
);

CREATE TABLE publishers (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100)
);

CREATE TABLE books (
  id INT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  publication_date DATE,
  genre VARCHAR(50),
  language VARCHAR(30),
  page_count INT,
  publisher_id INT,
  available_copies INT NOT NULL DEFAULT 0,
  FOREIGN KEY (publisher_id) REFERENCES publishers(id)
);

CREATE TABLE book_authors (
  book_id INT,
  author_id INT,
  PRIMARY KEY (book_id, author_id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE members (
  id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  membership_date DATE NOT NULL,
  membership_expiry DATE,
  membership_type VARCHAR(20) DEFAULT 'Standard'
);

CREATE TABLE loans (
  id INT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  loan_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  fine_amount DECIMAL(8, 2) DEFAULT 0.00,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);`
  }
];
