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

    constructor(private usersService: UsersService, public options ? : any) {
        super(options, {
            name: 'usersPlugin',
            version: '1.0.0'
        });
    }

    _register(server, options) {
        server.route({
            method: 'GET',
            path: '/users',
            config: {
                auth: {
                    // Scope ensures this operation is available only to users with "admin" scope.
                    scope: ["admin"]
                },
                handler: this.getAllUsers
            }
        })

        server.route({
            method: 'PUT',
            path: '/users/{user}',
            config: {
                auth: {
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
                handler: this.setUser,
            }
        })

        server.route({
            method: 'DELETE',
            path: '/users/{user}',
            config: {
                auth: {
                    scope: ["admin"]
                },
                validate: {
                    params: {
                        user: Joi.string().required().alphanum()
                    }
                },
                handler: this.deleteUser,
            }
        })

        server.route({
            method: 'POST',
            path: '/password',
            config: {
                validate: {
                    payload: {
                        newPassword: Joi.string().required()
                    }
                },
                handler: this.changePassword,
            }
        })
    }


    /**
     * Returns a list of all users and their information, passwords excluded.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    getAllUsers(request, reply) {
        this.usersService.getAll(function(err, data) {
            if (err) {
                return reply({
                    result: -1,
                    message: this.userService.errorCodeToMessage(-1)
                });
            } else {
                // Clears all passwords
                let returnData = data.map(function(user, index) {
                    user.password = undefined;
                    return user;
                });

                return reply({
                    result: 0,
                    data: returnData
                });
            }
        });
    }

    /**
     * Adds or overwrites a user.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    setUser(request, reply) {
        let newUser = new User(
            request.params.user,
            request.payload.password,
            request.payload.email,
            request.payload.scope);

        this.usersService.add(newUser, function(err) {
            if (err) return reply({
                result: -1,
                message: this.userService.errorCodeToMessage(-1)
            });

            return reply({
                result: 0,
                message: `User "${newUser.username}" added successfully.`
            });
        });
    }

    /**
     * Removes a user.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    deleteUser(request, reply) {
        let username = request.params.user;

        this.usersService.remove(username, function(err) {
            if (err) {
                let message: string = `User removal failed. ` + this.usersService.errorCodeToMessage(err);
                return reply({
                    result: err,
                    message: message
                });
            }

            return reply({
                result: 0,
                message: `User "${username}" removed successfully.`
            });
        });
    }

    /**
     * Changes the user's own password.
     * 
     * @param {any} request
     * @param {any} reply
     * 
     * @memberOf UsersPlugin
     */
    changePassword(request, reply) {
        let self = this;

        // Gets username from request.
        // (The token is valid, since the call arrived to this point).
        let username = request.auth.credentials.username;

        // Sets the new password. This will be hashed by the UsersService.add function.
        let newPassword = request.payload.newPassword;

        this.usersService.get(username, function(err, user) {
            if (err) return reply({
                result: -1,
                message: `Password change failed. ` + this.usersService.errorCodeToMessage(err)
            });

            // Sets the new password
            user.password = newPassword;

            // Overwrites the existing user
            self.usersService.add(user, function(err) {
                if (err) {
                    let message: string = `Failed to change password. ` + this.usersService.errorCodeToMessage(err);
                    return reply({
                        result: err,
                        message: message
                    });
                }

                return reply({
                    result: 0,
                    message: `Password successfully changed.`
                });
            });
        });
    }

}