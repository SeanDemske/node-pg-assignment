const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');
const { route } = require('../app');

let router = new express.Router();

router.get("/", async function(req, res, next) {
    try {
        const result = await db.query(`
        SELECT industry_name, code
        FROM companies AS c
        JOIN companies_industries AS ci
        ON c.code = ci.companies_ref
        JOIN industries as i
        ON i.industry_code = ci.industry_ref
        GROUP BY industry_name, code`);

        const formattedResponse = {industries: {}}
        result.rows.forEach(row => {
            if (formattedResponse.industries[row.industry_name]) {
                formattedResponse.industries[row.industry_name].push(row.code);
            } else {
                formattedResponse.industries[row.industry_name] = [row.code]
            }
        });

        return res.json(formattedResponse);
    } catch(err) {
        return next(err);
    }
});

router.post("/", async function(req, res, next) {
    try {
        let { industry_code, industry_name } = req.body;
        const result = await db.query(`
            INSERT INTO industries
            VALUES ($1, $2)
            RETURNING industry_code, industry_name`,
            [industry_code, industry_name]
        );
        res.status(200).json({industry: result.rows[0]});

    } catch(err) {
        return next(err);
    }
})

router.post("/:industry_ref/associate-company", async function(req, res, next) {
    try {
        let { company_ref } = req.body;
        let { industry_ref } = req.params;
        const result = await db.query(`
            INSERT INTO companies_industries (industry_ref, companies_ref)
            VALUES  ($1, $2)
            RETURNING industry_ref, companies_ref`,
            [industry_ref, company_ref]
        );

        if (result.rows.length === 0) {
            throw new ExpressError("Invalid request", 400);
        }

        res.status(201).json({industry_company: result.rows[0]});
    } catch(err) {
        return next(err);
    }
})

module.exports = router;