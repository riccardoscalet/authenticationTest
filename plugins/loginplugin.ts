import {
    Plugin
} from "./plugin";
import * as Joi from "joi";

const levelup = require("levelup");

export class LoginPlugin extends Plugin {
    db: LevelUp;

    constructor(public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '0.1.0'
        });

        this.db = options.db;
    }

    _register(server, options) {
        server.route({
            method: 'POST',
            path: '/login',
            handler: this.login,
            config: {
                validate: {
                    payload: {
                        user: Joi.string().required(),
                        password: Joi.string().required()
                    }
                }
            }
        })
    }

    login(request, reply) {
        let credentials = {
            user: request.payload.user,
            password: request.payload.password
        };

        this.db.get(credentials.user, function (err, value) {
            if (err) {
                if (err.notFound) {
                    return reply({
                        result: 2,
                        message: "User does not exist."
                    });
                }

                return reply({
                    result: -1,
                    message: "Error occurred!",
                    error: err
                });
            }

            if (value) return reply({
                result: 0,
                message: "Login successful."
            });

            return reply({
                result: 1,
                message: "Login failed."
            });
        });

    }
}