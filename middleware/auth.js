"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

/* 
*/

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when user must be logged in, and also when isAdmin is required.
 *
 *    I believe res.locals has been set above to contain whether or not isAdmin = true in the req/res cycle.
 * 
 */

function ensureLoggedIn(req, res, next) {
  try {
    console.log("****", res.locals)
    // Check if a user is logged in. If not, throw Unauthorized
    if (!res.locals.user) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if route involves Admin requirement, proceed to next function, or throw error
    if (isAdminActionRoute(req)) {

      // If user is not an Admin, throw error
      if (!res.locals.user.isAdmin) {
        throw new ForbiddenError("Admin privileges required");
      }
    } else {
      // If not an admin action, call ensureAuthenticatedAsSelf for user ownership check, allowing for self-actions
      ensureAuthenticatedAsSelf(req, res, next);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

// Helper function to check if route is an Admin-level company-related action.
// The instructions for the assignment said not to change any route code, so I created a function to implement inside ensureLoggedIn function above.
function isAdminActionRoute(req) {
  // Define the list of route methods and paths where Admin company actions occur
  const companyActionRoutes = [
    { method: "POST", path: "/" },            // Create company
    { method: "PATCH", path: "/:handle" },    // Update company
    { method: "DELETE", path: "/:handle" },   // Delete company
  ];

  // Define the list of route methods and paths where Admin user actions occur
  const userActionRoutes = [
    { method: "POST", path: "/user" },          // Create user(This is not the registration route)
    { method: "GET", path: "/users" },          // Get list of all users
    { method: "GET", path: "/:username" },      // Get information on a user
    { method: "PATCH", path: "/:username" },    // Update a user
    { method: "DELETE", path: "/:username" },   // Delete a user
  ]

  // Check if current route matches any of the above defined action routes (company or user)
  // we concat the arrays, and use .some to iterate/check if at least one element satisfies the condition 
  return companyActionRoutes.concat(userActionRoutes).some(route => {
    return route.method === req.method && req.originalUrl.startsWith(route.path);
  });

}


// Helper function that ensures user is authorized as self to take action on own routes
function ensureAuthenticatedAsSelf(req, res, next) {
  try {
    // Check if a user is authenticated
    if (!res.locals.user) {
      throw new UnauthorizedError("Authentication required");
    }

    // Get the authenticated user's username
    const authenticatedUsername = res.locals.user.username;

    // Get the requested username from the route parameters
    const requestedUsername = req.params.username;

    // Check if the authenticated user matches the requested user and if not, throw error
    if (authenticatedUsername !== requestedUsername) {
      throw new ForbiddenError("You do not have permission to perform this action.");
    }

    // If the user is authenticated as themselves, allow the action and proceed
    return next();
  } catch (err) {
    return next(err);
  }
}



module.exports = {
  authenticateJWT,
  ensureLoggedIn,
};
