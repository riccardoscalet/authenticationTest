import {
    Plugin
} from "./plugin";
var levelup = require("levelup");

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
            method: 'GET',
            path: '/addUser/{user}',
            handler: this.addUser
        })

        server.route({
            method: 'GET',
            path: '/login/{user}',
            handler: this.login
        })

        server.route({
            method: 'GET',
            path: '/getAllUsers',
            handler: this.getAllUsers
        })
    }

    addUser(request, reply) {
        let newUser = request.params.user;
        this.db.put(newUser, newUser, function (err) {
            reply("User added.");
        });
    }

    getAllUsers(request, reply) {
        let returnData;

        this.db.createReadStream()
            .on('data', function (data) {
                returnData += data;
            }).on('end', function () {
                reply(returnData);
            })
    }

    login(request, reply) {
        let loginUser = request.params.user;
        this.db.get(loginUser, function (err, value) {
            // if (err) {
            //     if (err.type == 'NotFoundError') {
            //         return reply({
            //             result: 1,
            //             message: "User does not exist."
            //         });
            //     }

            //     return reply({
            //         result: -1,
            //         message: "Error occurred!",
            //         error: err
            //     });
            // }

            if (value) return reply({
                result: 0,
                message: "Login successful!"
            });

            return reply({
                result: 2,
                message: "Login failed."
            });
        });

    }
}