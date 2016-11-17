import * as Joi from "joi";
const levelup = require("levelup");
const jwt = require('jsonwebtoken');

import { ServerMain, AuthenticationOptions } from "../server.main";
import { Plugin } from "./plugin";
import { User, UsersService } from "../services/users.service";

/**
 * Server plugin that manages all authentication operations.
 * 
 * @export
 * @class LoginPlugin
 * @extends {Plugin}
 */
export class LoginPlugin extends Plugin {
    constructor(private usersService: UsersService, public options?: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });
    }

    /**
     * Registers and configures server routes.
     * Method called by parent class Plugin. 
     * 
     * @param {any} server
     * @param {any} options
     * 
     * @memberOf LoginPlugin
     */
    _register(server, options) {
        // Login
        server.route({
            method: 'POST',
            path: '/api/login',
            config: {

                // Disables authentication for this route: login is used to obtain the token!
                auth: false,

                // Validates parameters
                validate: {
                    payload: {
                        username: Joi.string().required().alphanum(),
                        password: Joi.string().required()
                    }
                },

                handler: this.login
            }
        })

        // Special login that works only when called from localhost
        server.route({
            method: 'POST',
            path: '/api/login/localhost',
            config: {
                auth: false,
                handler: this.loginLocalhost
            }
        })

        // Simply checks is user token is still valid. The handler does basically nothing.
        server.route({
            method: 'POST',
            path: '/api/auth',
            config: {
                handler: this.auth
            }
        });

        // Logout
        server.route({
            method: ['GET', 'POST'],
            path: '/api/logout',
            config: {
                handler: this.logout
            }
        });


    }


    /**
     * Attempts to authenticate user.
     * If successful, returns token in body and cookie. Also returns user credentials.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf LoginPlugin
     */
    login(request, reply) {
        let self = this;

        let username: string = request.payload.username;
        let password: string = request.payload.password;

        this.usersService.validateCredentials(username, password, function (err, loginSuccessful, user) {
            if (err || !loginSuccessful) {
                // Returns error if login failed
                let message = `Login failed. ` + self.usersService.errorCodeToMessage(err);
                return reply({
                    result: err,
                    message: message
                })
            }
            else {
                // Calculates and returns token if login was successful

                // Creates JWT token
                let token = self.createToken(user);
                let tokenClear = jwt.decode(token);

                // Replies with token and sets the cookie on client
                return reply({
                    result: 0,
                    data: tokenClear,
                    token: token,
                    message: `Login successful. Welcome ${user.username}!`,
                }).state("token", token);
            }
        });
    }

    /**
     * Authenticates localhost user. Does not require credentials.
     * 
     * @param {any} request
     * @param {any} reply
     * @returns
     * 
     * @memberOf LoginPlugin
     */
    loginLocalhost(request, reply) {
        //TODO Can the client counterfeit remoteAddress? In that case, remove this method!!!

        // Returns error if request doesn't come from localhost
        if (request.info.remoteAddress != "127.0.0.1") {
            return reply({ result: -1 });
        }

        // Login is always successful from localhost
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

    /**
     * 
     * Simply checks is user token is still valid and returns user credentials if it is.
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf LoginPlugin
     */
    auth(request, reply) {
        reply({
            result: 0,
            data: request.auth.credentials
        });
    }

    /**
     * Logs out the user by deleting the cookie on client request.
     * 
     * @param {any} request
     * @param {any} reply
     * @returns
     * 
     * @memberOf LoginPlugin
     */
    logout(request, reply) {
        // Gets session credentials from client request. Credentials contains all useful user info.
        let username = request.auth.credentials.username;

        // Clears cookie on client
        return reply({
            result: 0,
            message: `Logout successful. Goodbye ${username}!`
        }).unstate("token");
    }

    /**
     * Creates JWT token 
     * 
     * @param {User} user
     * @returns
     * 
     * @memberOf LoginPlugin
     */
    createToken(user: User) {
        // Clears password before creating token, for security reasons.
        user.password = null;

        // Creates token.
        let token: string = jwt.sign(
            user,
            AuthenticationOptions.authKey, {
                algorithm: "HS256",
                expiresIn: AuthenticationOptions.authTtlSeconds
            });
        return token;
    }

}