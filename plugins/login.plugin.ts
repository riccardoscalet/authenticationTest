import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

const levelup = require("levelup");
const auth = require('hapi-auth-cookie');
const authToken = require('hapi-auth-jwt2');
const jwt = require('jsonwebtoken');

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

        server.register(auth, function (err) {
            if (err) throw err;
        });
        server.auth.strategy("cookieAuth", "cookie", {
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

    registerRoutes(server) {

        server.route({
            method: 'POST',
            path: '/login',
            config: {
                // Disables authentication for this route: login is meant to get the token!
                auth: false,
                // Configures how this route manages the state (cookie on client). 
                state: {
                    parse: true,
                    failAction: "log"
                },
                validate: {
                    payload: {
                        username: Joi.string().required().alphanum(),
                        password: Joi.string().required()
                    }
                },
                handler: function (request, reply) {
                    let username: string = request.payload.username;
                    let password: string = request.payload.password;

                    let sessionInfo = {
                        username: username
                    };

                    var token = jwt.sign(
                        sessionInfo,
                        authKey, {
                            algorithm: "HS256",
                            expiresIn: 60 * 60
                        });

                    this.login(
                        username,
                        password,
                        function (err, isValid, user) {
                            if (isValid && !err) {
                                request.cookieAuth.set(sessionInfo);
                                return reply(
                                    `Login successful.\r\n` +
                                    `Welcome ${user.username}!\r\n` +
                                    `\r\n` +
                                    `Your Token:\r\n` +
                                    `${token}`);
                            } else {
                                return reply(err);
                            }
                        });
                }
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
                handler: function (request, reply) {
                    // Flag isAuthenticated is true only if this call was validated with auth
                    if (request.auth.isAuthenticated) {
                        // Session credentials
                        var session = request.auth.credentials;
                    }

                    request.cookieAuth.clear();

                    return reply(`Logout Successful. Goodbye ${session.username}!`);
                }
            }
        })
    }



    login(username, password, callback) {
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

    tokenValidation(decoded, request, callback) {
        return callback(null, true);
    };
}