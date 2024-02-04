"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies based on optional filters.
   * 
   * @param {object} filters - Optional filters:
   *  - minEmployees
   *  - maxEmployees
   *  - name , "net" returns "Study Network" (case-insensitive/partial matching)
   * 
   *    @returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  static async findAll(filters = {}) {

    // the optional filters
    const { name, minEmployees, maxEmployees } = filters;

    // the base sql query
    let query = `
    SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
        FROM companies`;

    // the arr of input param values 
    const values = [];

    // Checks if a name is provided.
    // if so, append 'WHERE' to query to filter companies based on names,
    // 'LOWER' converts 'name' value in db to lowercase ensuring comparison is case-insensitive, db name is then compared to $1 (the 'name' param placeholder)
    // After adding 'WHERE' to the query, push 'name' into 'values' arr 
    // Using 'LIKE LOWER' and wrap value in % %, convert to lowercase and allows for partial matching/substring search, ex.) 'net' returns 'Study Network'
    if (name) {
      query += ` WHERE LOWER(name) LIKE LOWER($1)`;
      values.push(`%${name}%`);
    }

    // Checks if minEmployees is provided in query str.
    if (minEmployees) {

      // Then check if 'values' arr is empty
      if (values.length === 0) {

        // If both above conditions are met, append 'WHERE' to query to filter based on conditon that 'num_employees >= $2' (here, $2 is placeholder for value of 'minEmployees')
        query += ` WHERE num_employees >= $2`;
      } else {
        // If 'values' arr not empty:
        //  append 'AND' to query,
        // make new placeholder for 'minEmployees' value, '$3', coming after params $1 $2
        query += ` AND num_employees >= $${values.length + 1}`;
      }

      // push minEmployees value into arr to be used in the query
      values.push(minEmployees);
    }


    // Checks if maxEmployees is provided in query str.
    if (maxEmployees) {

      // Then check if value arr is empty
      if (values.length === 0) {

        // If both above conditions are met, append 'WHERE' to query to filter companies based on the condition that 'num_employees <= $2' (here, $2 is placeholder for maxEmployees)
        query += ` WHERE num_employees <=$2`;
      } else {
        // If 'values' arr not empty, we append 'AND clause to query to combine new filter condition with existing ones.
        // `AND num_employees <= $${values.length + 1}` generates a new placeholder for the maxEmployees value,
        //  ex.) if there was already one filter condition in the query, it would use $3 as maxEmployees placeholder
        query += ` AND num_employees <= $${values.length + 1}`;
      }

      // push maxEmployees into arr to be used in the query
      values.push(maxEmployees);
    }

    // Orders query by company name
    query += ` ORDER BY name`;

    //make the req and present the response rows
    const companiesRes = await db.query(query, values);
    return companiesRes.rows;

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   * 
   * Added Company associated jobs to res
   * 
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    // Fetch jobs associated with the company
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity
        FROM jobs
        WHERE company_handle = $1`,
      [handle]
    )

    // Include jobs data in the company object res
    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
