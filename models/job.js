"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     */
    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT id
                FROM jobs
                WHERE title = $1 AND company_handle = $2`,
            [title, companyHandle]
        );

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate job: ${title}`);
        }

        const result = await db.query(
            `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );

        const job = result.rows[0];
        return job;
    }

    /** Find all jobs based on optional filters.
     *
     * @param {object} filters - Optional filters:
     *  - minSalary
     *  - hasEquity
     *  - title (case-insensitive/partial matching)
     *
     * @returns [{ id, title, salary, equity, companyHandle }, ...]
     */
    static async findAll(filters = {}) {
        // Optional filters
        const { title, minSalary, hasEquity } = filters;
        const values = [];

        let query = `
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs`;

        // Check if job title is provided, 
        // if so,
        // add 'title' value to query with case-insensitivity/partial matching
        if (title) {
            query += ` WHERE LOWER(title) LIKE LOWER($1)`;
            values.push(`%${title}%`);
        }

        // Check if minSalary is provided in query str
        if (minSalary !== undefined) {
            // Check if values arr is empty
            if (values.length === 0) {
                // If both above conditions are met, append 'WHERE' to query to filter based on condtion that 'salary >= $1'
                query += ` WHERE salary >= $1`;
            } else {
                // If 'values' arr not empty:
                //      append 'AND' to query,
                //      make new placeholder for 'minSalary' value, '$3', coming after params $1 $2
                query += ` AND salary >= $${values.length + 1}`;
            }
            // push minSalary value into arr to be used in the query
            values.push(minSalary);
        }

        // Check if hasEquity provided in query str
        if (hasEquity !== undefined) {
            // Check if values arr is empty
            if (values.length === 0) {
                // If both above conditions are met, append 'WHERE' to query to filter based on condition that 'equity > 0'
                query += ` WHERE equity > 0`;
            } else {
                // If 'values' arr not empty:
                //      append 'AND' to query,
                //      make new placeholder for 'equity' value, '$3', coming after params $1 $2
                query += ` AND equity > 0`;
            }
            // push hasEquity value into arr to be used in the query
            values.push(hasEquity);
        }

        
        query += ` ORDER BY title`;

        const jobsRes = await db.query(query, values);
        return jobsRes.rows;
    }

    /** Given a job ID, return data about the job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *   where companyHandle is an object with the company's handle, name, description, and numEmployees
     *
     * Throws NotFoundError if not found.
     */
    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with ID: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" — it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data);
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
      UPDATE jobs 
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with ID: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     */
    static async remove(id) {
        const result = await db.query(
            `DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
            [id]
        );

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with ID: ${id}`);
    }
}

module.exports = Job;
