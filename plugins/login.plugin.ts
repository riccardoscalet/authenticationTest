import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

const levelup = require("levelup");

export class LoginPlugin extends Plugin {

    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });
    }

    _register(server, options) {
        server.route({
            method: 'POST',
            path: '/login',
            handler: this.login,
            config: {
                validate: {
                    payload: {
                        username: Joi.string().required(),
                        password: Joi.string().required()
                    }
                }
            }
        })
    }

    login(request, reply) {
        let credentials = {
            username: request.payload.username,
            password: request.payload.password
        };

        this.usersService.get(credentials.username, function (err, value) {
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

            if (value == credentials.password) return reply({
                result: 0,
                message: "Login successful."
            });
            else return reply({
                result: 1,
                message: "Login failed. Incorrect password."
            });
        });
    }
}