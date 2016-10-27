import {
    Plugin
} from "./plugin";
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
            method: 'GET',
            path: '/addUser/{user}',
            handler: this.addUser
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
        let returnData = [];
        this.db.createKeyStream()
            .on('data', function (data) {
                returnData.push(data);
            }).on('end', function () {
                reply(returnData);
            })
    }
}