const test = require("tape");

import * as Hapi from "hapi";
import * as TestUtils from "./test.utils";

import { UsersPlugin } from "../plugins/users.plugin";
import { UsersService } from "../services/users.service";

let server = TestUtils.createTestServer(8989,
    (err, server) => {
        let userService = {};
        let usersPlugin: UsersPlugin = new UsersPlugin(userService as UsersService);
        server.register([usersPlugin], function(err) { server.start(); });
    });


test("UsersPlugin.add - ", function(t) {
    //Arrange
    let options: Hapi.IServerInjectOptions = {
        method: "GET",
        url: "/users",
    }

    //Act
    server.inject(options, function(response) {
        console.log(response);
        t.end();
    })
});


server.stop();