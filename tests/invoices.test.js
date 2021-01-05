process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { query } = require('../db');
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
    SELECT id, comp_Code, amt, paid, paid_date, add_date
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

describe("GET /invoices", () => {
    test("Gets a list of invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ "invoices": testInvoices.map(inv => ({comp_code: inv.comp_code, id: inv.id})) });
    });
});

describe("GET /invoices/:id", () => {
    test("Gets a single invoice based on a url parameter", async () => {
        const res = await request(app).get(`/invoices/${testInvoices[0].id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"invoice": {
            id: testInvoices[0].id,
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: "Designed to test"
            },
            amt: testInvoices[0].amt,
            paid: testInvoices[0].paid,
            paid_date: testInvoices[0].paid_date
        }});
    });

    test("Invoice doesn't exist handler", async () => {
        const res = await request(app).get("/invoices/-1");
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    test("Adds a new invoice to the database", async () => {
        const res = await request(app).post("/invoices").send({
            comp_code: "test",
            amt: "500"
        });

        const queryResults = await db.query(`
        SELECT id, comp_code, amt, paid, paid_date
        FROM invoices
        `);

        const newInvoices = queryResults.rows;

        const newInvoice = newInvoices.find(inv => {
            return inv.id !== testInvoices[0].id && inv.id !== testInvoices[1].id
        })

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({"invoice": {
            id: newInvoice.id,
            comp_code: newInvoice.comp_code, 
            amt: newInvoice.amt, 
            paid: newInvoice.paid,  
            paid_date: newInvoice.paid_date
        }});
    });
});

describe("PUT /invoices/:id", () => {
    test("Updates an specified invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoices[0].id}`).send({ amt: "500"});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {
            id: testInvoices[0].id, 
            comp_code: testInvoices[0].comp_code, 
            amt: 500, 
            paid: testInvoices[0].paid, 
            paid_date: testInvoices[0].paid_date
        }});
    });

    test("Handles invalid id properly", async () => {
        const res = await request(app).put("/invoices/-1");
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes specified invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoices[1].id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({"msg": "deleted successfully"});
    });

    test("Handles invalid id properly", async () => {
        const res = await request(app).delete(`/invoices/-1`);
        expect(res.statusCode).toBe(404);
    });
});