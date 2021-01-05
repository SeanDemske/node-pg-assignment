const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();

router.get("/", async function(req, res, next) {
    try {
        const result = await db.query(
            `SELECT id, comp_code
            FROM invoices
            ORDER BY comp_code`
        );

        return res.json({"invoices": result.rows});

    } catch(err) {
        return next(err);
    }
});

router.get("/:id", async function(req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query(
            `SELECT i.id,
                    i.comp_code,
                    i.amt,
                    i.paid,
                    i.add_date,
                    i.paid_date,
                    c.name,
                    c.description
            FROM invoices AS i
                INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoices: ${id}`, 404);
        }

        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
            },
            amt: data.amt,
            paid: data.paid,
            paid_date: data.paid_date
        };

        return res.json({"invoice": invoice});

    } catch(err) {
        return next(err);
    }
});

router.post("/", async function(req, res, next) {
    try {
        let {comp_code, amt} = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, paid_date`,
            [comp_code, amt]
        );

        return res.status(201).json({"invoice": result.rows[0]});
        
    } catch(err) {
        return next(err);
    }
});

router.put("/:id", async function(req, res, next) {
    try {
        let id = req.params.id;
        let { amt, paid } = req.body;

        const queryBeforeUpdate = await db.query(`
            SELECT paid, paid_date
            FROM invoices
            WHERE id=$1`,
            [id]
        );

        if (queryBeforeUpdate.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404);
        }

        const hasPaid = queryBeforeUpdate.rows[0].paid;
        const currPayDate = queryBeforeUpdate.rows[0].paid_date;

        let paidDate;
        if (paid && !hasPaid) {
            const currentTime = new Date()
            const month = currentTime.getMonth() + 1
            const day = currentTime.getDate()
            const year = currentTime.getFullYear()
            paidDate = month + "/" + day + "/" + year
        } else if (!paid && hasPaid) {
            paidDate = null;
        } else {
            paidDate = currPayDate;
        }

        const result = await db.query(
            `UPDATE invoices
            SET amt=$1, paid=$3, paid_date=$4
            WHERE id=$2
            RETURNING id, comp_code, amt, paid, paid_date`,
            [amt, id, paid, paidDate]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404);
        } else {
            return res.json({"invoice": result.rows[0]});
        }

    } catch(err) {
        return next(err);
    }
});

router.delete("/:id", async function(req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query(
            `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404);
        } else {
            return res.json({"msg": "deleted successfully"});
        }
        
    } catch(err) {
        return next(err);
    }
})

module.exports = router;