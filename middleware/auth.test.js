"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAuthenticatedAsSelf
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  // Test when a user is logged in
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  // Test when there is no login (unauthorized)
  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });

  // Test when a non-admin user tries to access admin-required route
  test("forbidden if not admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof ForbiddenError).toBeTruthy();
    };
    // Mock a route that requires admin privileges (e.g., updating a company)
    req.originalUrl = "/example-admin-route";
    ensureLoggedIn(req, res, next);
  });

  // Test when an admin user tries to access admin-required route
  test("works for admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    // Mock a route that requires admin privileges (e.g., updating a company)
    req.originalUrl = "/example-admin-route";
    ensureLoggedIn(req, res, next);
  });

  // Tests for ensureAuthenticatedAs Self

  // Test for user authenticated as self
  test("works for authenticated as self", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test" } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAuthenticatedAsSelf(req, res, next);
  });

  // Tests if user is not authenticated as self
  test("forbidden if not authenticated as self", function () {
    expect.assertions(1);
    const req = { params: { username: "otherUser" } };
    const res = { locals: { user: { username: "test" } } };
    const next = function (err) {
      expect(err instanceof ForbiddenError).toBeTruthy();
    };
    ensureAuthenticatedAsSelf(req, res, next);
  });

  // Tests if user is trying to perform action on resource that does not belong to them
  test("unauth if not logged in", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAuthenticatedAsSelf(req, res, next);
  });


});




