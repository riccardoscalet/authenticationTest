import * as Joi from "joi";
const levelup = require("levelup");
const auth = require('hapi-auth-cookie');
const authToken = require('hapi-auth-jwt2');
const jwt = require('jsonwebtoken');

import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";


const authKey = "supersecretpasswordsadaaddsdadsdsadadsaddadsadsadadadd";
const authTtlSeconds = 60 * 60;


export class LoginPlugin extends Plugin {
    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });
    }


    _register(server, options) {
        this.registerAuthenticationStrategies(server);
        this.registerRoutes(server);
    }


    registerAuthenticationStrategies(server) {

        // Initializes JWT token authentication strategy.
        //      The client has to embed this token into the "Authorization" header of every subsequent REST call to server.
        server.register(authToken, function (err) {
            if (err) throw err;
        });
        server.auth.strategy('jwtAuth', 'jwt', {
            key: authKey,
            validateFunc: this.tokenValidation,
            verifyOptions: {
                algorithms: ['HS256']
            }
        });

        // Initializes cookie token authentication strategy.
        //      This strategy automatically stores the token inside a cookie on client.
        //      The browser takes care of sending the cookie to every subsequent REST call to server (inside "Cookie header).
        //      (This token is different from the JWT one, as the algorithm is different)
        server.register(auth, function (err) {
            if (err) throw err;
        });
        server.auth.strategy("cookieAuth", "cookie", {
            path: "/",
            password: authKey, // Cookie secret key
            cookie: "apollo-authentication-token", // Cookie name
            ttl: authTtlSeconds * 1000, // Time-To-Live of cookie set to 1 hour
            // redirectTo: "/login",
            isSecure: false,
        });

        // Sets default authentications for all server routes.
        server.auth.default({
            strategies: ["jwtAuth", "cookieAuth"]
        })
    }

    // This method is reached only if token is valid.
    tokenValidation(decoded, request, callback) {
        return callback(null, true);
    };


    registerRoutes(server) {

        server.route({
            method: 'POST',
            path: '/login',
            config: {

                // Disables authentication for this route: login is used to obtain the token!
                auth: false,

                // Validates parameters
                validate: {
                    payload: {
                        username: Joi.string().required().alphanum(),
                        password: Joi.string().required(),
                        cookie: Joi.bool().default(true)
                    }
                },

                handler: this.login
            }
        })

        server.route({
            method: ['GET', 'POST'],
            path: '/logout',
            config: {
                auth: {
                    // Logout only makes sense if client is using cookies
                    strategy: "cookieAuth"
                },
                handler: this.logout
            }
        });
    }


    login(request, reply) {
        let username: string = request.payload.username;
        let password: string = request.payload.password;

        this.loginDb(username, password, function (err, loginSuccessful, user) {

            if (loginSuccessful && !err) {

                // Sets cookie (containing the token) on client request
                request.cookieAuth.set(user);

                // Creates JWT token 
                var token = jwt.sign(
                    user,
                    authKey, {
                        algorithm: "HS256",
                        expiresIn: authTtlSeconds
                    });

                return reply({
                    result: 0,
                    token: token,
                    message: `Login successful.\r\n` +
                        `Welcome ${user.username}!`,
                });
            }

            return reply({
                result: -1,
                message: err
            });

        });
    }

    logout(request, reply) {
        // Flag isAuthenticated is true only if this call was validated with hapi auth
        if (request.auth.isAuthenticated) {
            // Gets session credentials from client request
            var session = request.auth.credentials;
        }

        // Deletes cookie from client
        request.cookieAuth.clear();

        return reply({
            result: 0,
            message: `Logout Successful.\r\n` +
                `Goodbye ${session.username}!`
        });
    }

    loginDb(username, password, callback) {
        this.usersService.get(username, function (err, value) {
            if (err) {
                if (err.notFound) return callback("User does not exist.", false);
                else return callback("Error occurred!", false);
            }

            if (value == password) {
                let user = {
                    username: username
                }
                return callback(null, true, user)
            } else {
                return callback("Login failed. Incorrect password.", false);
            }
        });
    }

}