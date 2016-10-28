import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

const levelup = require("levelup");
const auth = require('hapi-auth-basic');

export class LoginPlugin extends Plugin {

    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });
    }

    _register(server, options) {
        server.register(auth, function (err) {
            if (err) throw err;
        });

        server.auth.strategy("simpleAuthentication", "basic", {
            validateFunc: $.proxy(this.login, this)
        });

        server.route({
            method: 'POST',
            path: '/login',
            config: {
                validate: {
                    payload: {
                        username: Joi.string().required(),
                        password: Joi.string().required()
                    }
                },
                auth: "simpleAuthentication",
                handler: function (request, reply) {
                    reply(request.auth.credentials.name);
                }
            }
        })

        server.route({
            method: 'POST',
            path: '/logout',
            config: {
                handler: function (request, reply) {
                    request.auth.session.clear();
                    return reply("Logout Successful.");
                }
            }
        })
    }

    login(request, username, password, callback) {
        // let credentials = {
        //     username: request.payload.username,
        //     password: request.payload.password
        // };

        this.usersService.get(username, function (err, value) {
            if (err) {
                if (err.notFound) return callback("User does not exist.", false);
                else return callback("Error occurred!", false);
            }

            if (value == password) return callback(null, true);
            else return callback("Login failed. Incorrect password.", false);
        });
    }
}