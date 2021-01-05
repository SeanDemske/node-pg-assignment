-- Run this to create a testing database

DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS companies_industries CASCADE;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    industry_code text NOT NULL UNIQUE PRIMARY KEY,
    industry_name text NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    id serial PRIMARY KEY,
    industry_ref text NOT NULL REFERENCES industries ON DELETE CASCADE,
    companies_ref text NOT NULL REFERENCES companies ON DELETE CASCADE
);
