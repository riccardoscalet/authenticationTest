import {
    Plugin
} from "./plugin";
import {
    User
} from "../model/user";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

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
            handler: this.addUser,
            config: {
                validate: {
                    params: {
                        user: Joi.string().required().alphanum()
                    },
                    payload: {
                        password: Joi.string().required()
                    }
                }
            }
        })

        server.route({
            method: 'GET',
            path: '/users',
            handler: this.getAllUsers
        })
    }

    addUser(request, reply) {
        let newUser = new User(request.params.user, request.payload.password);

        this.usersService.add(newUser, function (err) {
            if (err) return reply(err);
            else return reply({
                result: 0,
                message: "User added."
            });
        });
    }


    getAllUsers(request, reply) {
        this.usersService.getAll(function (data) {
            reply(data);
        });
    }

}