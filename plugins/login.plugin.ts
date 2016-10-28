import {
    Plugin
} from "./plugin";
import {
    UsersService
} from "../services/users.service";
import * as Joi from "joi";

const levelup = require("levelup");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

export class LoginPlugin extends Plugin {

    constructor(private usersService: UsersService, public options: any) {
        super(options, {
            name: 'loginPlugin',
            version: '1.0.0'
        });

        this.initialize(); // TODO Move this crap out of contructor
    }

    initialize() {
        let self = this;

        passport.use(new LocalStrategy(
            function (username, password, done) {
                self.usersService.get(
                    username,
                    function (err, user) {
                        if (err) return done(err);
                        if (!user) return done(null, false);
                        if (user.password != password) return done(null, false);
                        return done(null, user);
                    });
            }
        ));

        passport.serializeUser(function (user, done) {
            done(null, user.username);
        });

        passport.deserializeUser(function (username, done) {
            this.usersService.get(username, function (err, user) {
                done(err, user);
            });
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
        passport.authenticate('local', {
            failureRedirect: '/login'
        })(request, reply);

        reply(0);

        // let credentials = {
        //     username: request.payload.username,
        //     password: request.payload.password
        // };

        // passport.authenticate('local', {
        //         // failureRedirect: '/login'
        //     }),
        //     function (request, reply) {
        //         reply(0);
        //     }
        //     // function (err) {
        //     //     reply({
        //     //         result: 0,
        //     //         message: "User added."
        //     //     });
        //     // };
    }

    // this.usersService.get(credentials.username, function (err, value) {
    //     if (err) {
    //         if (err.notFound) {
    //             return reply({
    //                 result: 2,
    //                 message: "User does not exist."
    //             });
    //         }

    //         return reply({
    //             result: -1,
    //             message: "Error occurred!",
    //             error: err
    //         });
    //     }

    //     if (value) return reply({
    //         result: 0,
    //         message: "Login successful."
    //     });

    //     return reply({
    //         result: 1,
    //         message: "Login failed."
    //     });
    // });
}