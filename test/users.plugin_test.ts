const test = require("tape");
import * as Hapi from "hapi";

import { UsersPlugin } from "../plugins/users.plugin";
import { UsersService } from "../services/users.service";

let server = new Hapi.Server();
let userService = {};
let usersPlugin: UsersPlugin = new UsersPlugin(userService as UsersService);

server.connection({ port: 8989 });
// server.register([usersPlugin], function(err) {
//     server.start();
// });

// test("UsersPlugin.add - ", function(t) {
//     //Arrange
//     let options: Hapi.IServerInjectOptions = {
//         method: "GET",
//         url: "/users",
//     }

//     //Act
//     server.inject(options, function(response) {
//         console.log(response);
//         t.end();
//     })
// });