const test = require("tape");

import * as Hapi from "hapi";
import * as TestUtils from "./test.utils";

import { UsersPlugin } from "../plugins/users.plugin";
import { UsersService } from "../services/users.service";

// UsersService mock
let usersService: any = {
    getAll(callback) {
        callback(undefined, [{ username: "User1" }, { username: "User2" }, { username: "User3" }])
    }
};

let server = TestUtils.createTestServer(8989,
    (err, server) => {
        let usersPlugin: UsersPlugin = new UsersPlugin(usersService);
        server.register([usersPlugin], function(err) { server.start(); });
    });


test("UsersPlugin.users - With admin user scope - Should return all users", function(t) {
    //Arrange
    let options: Hapi.IServerInjectOptions = {
        method: "GET",
        url: "/users",
        credentials: { scope: ["admin"] }
    }

    //Act
    server.inject(options, function(response: any) {
        t.equal(response.statusCode, 200, "Response: OK");
        t.equal(response.result.result, 0, "Operation was completed successfully");
        t.equal(response.result.data.length, 3, "Returned all users");
        t.end();
    })
});

test("UsersPlugin.users - With insufficient user scope - Should forbid call", function(t) {
    //Arrange
    let options: Hapi.IServerInjectOptions = {
        method: "GET",
        url: "/users",
        credentials: { scope: ["normal"] }
    }

    //Act
    server.inject(options, function(response: any) {
        t.equal(response.statusCode, 403, "Response: Forbidden");
        t.end();
    })
});

server.stop();