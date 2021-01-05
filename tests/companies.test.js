process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoices;
beforeEach(async () => {
    const testData = await db.query(`
    INSERT INTO companies
    VALUES  ('test', 'Test Company', 'Designed to test');

    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES  ('test', 100, true, null),
            ('test', 200, false, null);
    `);

    const testCompanyResult = await db.query(`
    SELECT code, name
    FROM companies
    `);

    testCompany = testCompanyResult.rows[0];

    const testInvoicesResult = await db.query(`
    SELECT id, comp_Code, amt, paid, paid_date
    FROM invoices
    `);

    testInvoices = testInvoicesResult.rows;
});

afterEach(async () => {
    await db.query(`DELETE FROM companies; DELETE FROM invoices;`)
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Gets a list of our single test company", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"companies": [testCompany]});
    });
});

describe("GET /companies/:code", () => {
    test("Gets a single company based on a url parameter", async () => {
        const res = await request(app).get("/companies/test");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"company": {
            code: testCompany.code,
            name: testCompany.name,
            description: "Designed to test",
            invoices: testInvoices.map(inv => inv.id)
            }
        });
    })

    test("Company does not exist handler", async () => {
        const res = await request(app).get("/companies/doesnotexist");
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /companies", () => {
    test("Adds a company to the database", async () => {
        const res = await request(app).post("/companies").send({
            code: "test2",
            name: "Test Company 2",
            description: "Number 2"
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({"company": {
            code: "test2",
            name: "Test Company 2",
            description: "Number 2"
        }});
    });
});

describe("PUT /companies/:code", () => {
    test("Updates a company to the database", async () => {
        const res = await request(app).put("/companies/test").send({
            name: "Test Company Updated",
            description: "Updated description"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"company": {
            code: "test",
            name: "Test Company Updated",
            description: "Updated description"
        }});
    });

    test("Company does not exist handler", async () => {
        const res = await request(app).put("/companies/doesnotexist");
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a company from the database", async () => {
        const res = await request(app).delete("/companies/test");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"msg": "deleted"});
    });

    test("Company does not exist handler", async () => {
        const res = await request(app).delete("/companies/doesnotexist");
        expect(res.statusCode).toBe(404);
    });
});