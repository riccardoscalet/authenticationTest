import * as Joi from "joi";
import { Plugin } from "./plugin";
import { User, UsersService } from "../services/users.service";
const levelup = require("levelup");
const authToken = require('hapi-auth-jwt2');
const jwt = require('jsonwebtoken');

const authKey = "supersecretpasswordsadaaddsdadsdsadadsaddadsadsadadadd";
const authTtlSeconds = 60 * 60; // Token remains valid for one hour


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
        // Configures cookie
        server.state("token", {
            path: "/",
            // domain: "localhost",
            encoding: "none",
            ttl: authTtlSeconds * 1000, // Time-to-live of cookie
            isSecure: false,
            isHttpOnly: false,
            isSameSite: false,
        });

        // Initializes JWT token authentication strategy.
        //      For every subsequent REST call to server, the client can either embed this token into the "Authorization" header,
        //      or send the cookie "token" to the server (browsers do this automatically).
        server.register(authToken, function(err) {
            if (err) throw err;
        });
        server.auth.strategy('jwtAuth', 'jwt', {
            key: authKey,
            validateFunc: function(decoded, request, callback) {
                // This method is reached only if token is valid.

                return callback(null, true);
            },
            verifyOptions: {
                algorithms: ['HS256']
            },
            cookieKey: "token"
        });

        // Sets default authentications for all server routes.
        server.auth.default({
            strategies: ["jwtAuth"]
        })
    }

    registerRoutes(server) {

        // Login
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

        // Special login that works only when called from localhost
        server.route({
            method: 'POST',
            path: '/login/localhost',
            config: {
                auth: false,
                handler: this.loginLocalhost
            }
        })

        // Logout
        server.route({
            method: ['GET', 'POST'],
            path: '/logout',
            config: {
                handler: this.logout
            }
        });
    }


    login(request, reply) {
        let self = this;

        let username: string = request.payload.username;
        let password: string = request.payload.password;

        this.validateCredentials(username, password, function(err, loginSuccessful, user) {

            // Calculates and returns token if login was successful
            if (loginSuccessful && !err) {

                // Creates JWT token
                let token = self.createToken(user);

                // Replies with token and sets the cookie on client
                return reply({
                    result: 0,
                    token: token,
                    message: `Login successful. Welcome ${user.username}!`,
                }).state("token", token);
            }

            // Returns error if login failed
            return reply({
                result: -1,
                message: err
            });

        });
    }

    loginLocalhost(request, reply) {

        //TODO Can the client counterfeit remoteAddress? In that case, remove this method!!!

        // Login is always successful from localhost
        if (request.info.remoteAddress == "127.0.0.1") {
            let user: User = {
                username: "Banana God Administrator",
                password: "GuessWhatYesBanana",
                email: "banana@banana.org",
                scope: ["admin", "bananaman"]
            }

            let token = this.createToken(user);

            // Replies with token and sets the cookie on client
            return reply({
                result: 0,
                token: token,
                message: `Login successful. Welcome ${user.username}!`,
            }).state("token", token);
        }

        // Returns error if login failed
        return reply({
            result: -1
        });
    }

    logout(request, reply) {
        // Flag isAuthenticated is true only if this call was validated with hapi auth
        if (request.auth.isAuthenticated) {
            // Gets session credentials from client request
            var session = request.auth.credentials;
        }

        // Clears cookie on client
        return reply({
            result: 0,
            message: `Logout successful. Goodbye ${session.username}!`
        }).unstate("token");
    }


    validateCredentials(
        username: string,
        password: string,
        callback: (err: string, isValid: boolean, user ? : User) => void): void {

        this.usersService.get(username, function(err, user: User) {
            if (err) {
                if (err.notFound) return callback(`User ${username} does not exist.`, false);
                return callback("Error occurred!", false);
            }

            if (user.password == password) return callback(null, true, user);
            return callback("Login failed. Incorrect password.", false);
        });
    }

    // Creates JWT token 
    createToken(user: User) {
        let token: string = jwt.sign(
            user,
            authKey, {
                algorithm: "HS256",
                expiresIn: authTtlSeconds
            });
        return token;
    }

}