import * as Joi from "joi";

import {
    Plugin
} from "./plugin";
import {
    User
} from "../model/user";
import {
    UsersService
} from "../services/users.service";


export class UsersPlugin extends Plugin {

    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'usersPlugin',
            version: '1.0.0'
        });
    }

    _register(server, options) {
        server.route({
            method: 'PUT',
            path: '/users/{user}',
            config: {
                validate: {
                    params: {
                        user: Joi.string().required().alphanum()
                    },
                    payload: {
                        password: Joi.string().required(),
                        scope: Joi.array().items(Joi.string()).required()
                    }
                },
                handler: this.addUser,
            }
        })

        server.route({
            method: 'GET',
            path: '/users',
            config: {
                handler: this.getAllUsers
            }
        })
    }


    addUser(request, reply) {
        let newUser = new User(
            request.params.user,
            request.payload.password,
            request.payload.scope);

        this.usersService.add(newUser, function (err) {
            if (err) return reply({
                result: -1,
                message: err
            });

            return reply({
                result: 0,
                message: `User ${newUser.username} added successfully.`
            });
        });
    }


    getAllUsers(request, reply) {
        this.usersService.getAll(function (err, data) {
            if (err) return reply({
                result: -1,
                message: err
            });

            return reply({
                result: 0,
                data: data
            });
        });
    }

}