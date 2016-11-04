import * as Joi from "joi";
import { Plugin } from "./plugin";
import { User, UsersService } from "../services/users.service";


/**
 * Server plugin that manages all operations on users.
 * 
 * @export
 * @class UsersPlugin
 * @extends {Plugin}
 */
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
                auth: {
                    // Scope ensures this operation is available only to users with "admin" scope.
                    scope: ["admin"]
                },
                validate: {
                    params: {
                        user: Joi.string().required().alphanum()
                    },
                    payload: {
                        password: Joi.string().required(),
                        email: Joi.string().email().required(),
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
                auth: {
                    scope: ["admin"]
                },
                handler: this.getAllUsers
            }
        })
    }


    /**
     * Adds or overwrites a user.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    addUser(request, reply) {
        let newUser = new User(
            request.params.user,
            request.payload.password,
            request.payload.email,
            request.payload.scope);

        this.usersService.add(newUser, function(err) {
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

    /**
     * Returns a list of all users.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    getAllUsers(request, reply) {
        this.usersService.getAll(function(err, data) {
            if (err.length == 0) {
                return reply({
                    result: 0,
                    data: data
                });
            }

            return reply({
                result: -1,
                data: data,
                message: "Error occurred!"
            });
        });
    }

}