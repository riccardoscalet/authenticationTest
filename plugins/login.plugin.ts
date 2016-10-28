import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

const levelup = require("levelup");
const auth = require('hapi-auth-cookie');

export class LoginPlugin extends Plugin {
    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });
    }

    _register(server, options) {
        const cache = server.cache({
            segment: "sessions",
            expiresIn: 3 * 24 * 60 * 60 * 1000
        });
        server.app.cache = cache;

        server.register(auth, function (err) {
            if (err) throw err;
        });

        server.auth.strategy("cookieAuth", "cookie", {
            password: "supersecretpasswordsadaaddsdadsdsadadsaddadsadsadadadd", // cookie secret
            cookie: "authentication-test-cookie", // Cookie name
            ttl: 24 * 60 * 60 * 1000, // Set session to 1 day
            // redirectTo: "/login",
            isSecure: false,
            validateFunc: function (request, session, callback) {
                cache.get(session.username, (err, cached) => {
                    if (err) return callback(err, false);
                    if (!cached) return callback(null, false);
                    return callback(null, true, cached.account);
                });
            }
        });

        server.route({
            method: 'POST',
            path: '/login',
            config: {
                validate: {
                    payload: {
                        username: Joi.string().required().alphanum(),
                        password: Joi.string().required()
                    }
                },
                // auth: {
                //     mode: "try"
                // },
                // plugins: {
                //     "hapi-auth-cookie": {
                //         redirectTo: false
                //     }
                // },
                handler: function (request, reply) {
                    this.login(
                        request.payload.username,
                        request.payload.password,
                        function (err, isValid, user) {
                            if (isValid && !err) {
                                request.server.app.cache.set(user.username, user, 0,
                                    (err) => {
                                        request.cookieAuth.set(user);
                                        return reply(`Login successful.\r\nWelcome ${user.username}!`);
                                    });

                            } else {
                                return reply(err);
                            }
                        });
                }
            }
        })

        server.route({
            method: 'POST',
            path: '/logout',
            config: {
                auth: "cookieAuth",
                handler: function (request, reply) {
                    request.cookieAuth.clear();
                    return reply("Logout Successful.");
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
            } else return callback("Login failed. Incorrect password.", false);
        });
    }

}