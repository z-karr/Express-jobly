"use strict";


const request = require("supertest");
const db = require("../db");
const app = require("../app");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
} = require("./_testCommon");


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    // Sample job data for testing
    const newJob = {
        title: "New Job",
        salary: 50000,
        equity: "0.01",
        companyHandle: "c1",
    };

    // Test a successful creation of a job
    test("ok for auth users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job).toEqual(expect.objectContaining(newJob));
    });

    // Test a bad request with missing data
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 50000,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    // Test a bad request with invalid data
    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: "not-a-number",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    // Test retrieving all jobs
    test("ok for anon user", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toBeDefined();
    });

    // Test a failure due to dropping jobs table
    test("fails: test next() handler", async function () {
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    // Test retrieving a job by ID
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.job).toBeDefined();
    });

    // Test a Not found for non-existent job ID
    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/999`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    // Test update a job
    test("works for users", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.job.title).toEqual("Updated Job");
    });

    // Test unauthorized access for non-logged in user
    test("unauth for anon", async function () {
        const resp = await request(app).patch(`/jobs/1`).send({
            title: "Updated Job",
        });
        expect(resp.statusCode).toEqual(401);
    });

    // Test Not found for non-existent job ID
    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/999`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    // Test a bad request on invalid data
    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    // Test delete a job
    test("works for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    // Test unauthorized access for non-logged in user
    test("unauth for anon", async function () {
        const resp = await request(app).delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    // Test Not found for non-existent job ID
    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/999`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
