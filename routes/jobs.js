const express = require("express");
const router = new express.Router();
const Job = require("../models/job");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

/** POST / { job } =>  { job }
 *
 * Create a new job. Admin required.
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Get a list of all jobs.
 *
 * Authorization required: None
 */

router.get("/", async function (req, res, next) {
    try {
        const jobs = await Job.findAll(req.query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id] => { job }
 *
 * Get job details by ID.
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: None
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { job } => { job }
 *
 * Update job details (partial update). Admin required.
 *
 * Data can include: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Delete a job by ID. Admin required.
 *
 * Authorization required: login
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;