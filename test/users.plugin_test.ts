const test = require("tape");
import * as sinon from "sinon";

import * as Hapi from "hapi";
import * as TestUtils from "./test.utils";

import { UsersPlugin } from "../plugins/users.plugin";
import { UsersService } from "../services/users.service";


function mockUsersService(): any {
    return {
        get: () => void {},
        add: () => void {},
        remove: () => void {},
        getAll: () => void {},
        validateCredentials: () => void {}
    }
}

test("UsersPlugin/users - With admin user scope - Should return all users without passwords", function(t) {
    //Arrange
    let usersService = mockUsersService();
    let stubGetAll = sinon.stub(usersService, "getAll", function(callback) {
        callback(undefined, [
            { username: "User1", password: "Banana" },
            { username: "User2", password: "Cipolla" },
            { username: "User3", password: "Corn Flakes" }
        ]);
    });
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "GET",
        url: "/users",
        credentials: { scope: ["admin"] }
    }

    //Act
    TestUtils.createTestServer(8989, [usersPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubGetAll.called);
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, 0, "Operation was completed successfully");
                t.equal(response.result.data.length, 3, "Returned all users");
                response.result.data.forEach((element, index) => {
                    t.equal(element.password, undefined, `Element ${index}'s password was cleared`);
                });
                server.stop(t.end);
            });
        }));
});


test("UsersPlugin/users - With insufficient user scope - Should forbid call", function(t) {
    //Arrange
    let usersService = mockUsersService();
    let spyGetAll = sinon.spy(usersService, "getAll");
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "GET",
        url: "/users",
        credentials: { scope: ["normal"] }
    }

    //Act
    TestUtils.createTestServer(8989, [usersPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.false(spyGetAll.called);
                t.equal(response.statusCode, 403, "Response: Forbidden");
                server.stop(t.end);
            });
        }));
});

test("UsersPlugin/users/abc - Should add user", function(t) {
    //Arrange
    let usersService = mockUsersService();
    let stubAdd = sinon.stub(usersService, "add",
        function(user, callback) {
            return callback(undefined);
        });
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "PUT",
        url: "/users/abc",
        payload: {
            password: "Asdrubale",
            email: "asdrubale69@gmail.com",
            scope: ["normal", "pigfarmer"]
        },
        credentials: { scope: ["admin"] }
    }

    //Act
    TestUtils.createTestServer(8989, [usersPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubAdd.called);
                t.equal(response.statusCode, 200, "Response: OK");
                server.stop(t.end);
            });
        }))
});