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
    let stubGetAll = sinon.stub(usersService, "getAll")
    stubGetAll.callsArgWith(0, //Calls the callback that is parameter 0, with the following args
        undefined, [
            { username: "User1", password: "Banana" },
            { username: "User2", password: "Cipolla" },
            { username: "User3", password: "Corn Flakes" }
        ]);

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
                t.true(stubGetAll.called, "Called UserService.getAll");
                t.equal(response.statusCode, 200, "Response: OK");
                //response.result contains everything returned with reply
                t.equal(response.result.result, 0, "Operation completed successfully");
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
                t.false(spyGetAll.called, "Not called UserService.getAll");
                t.equal(response.statusCode, 403, "Response: Forbidden");
                server.stop(t.end);
            });
        }));
});

test("UsersPlugin/users/abc PUT - Should add user", function(t) {
    //Arrange
    let usersService = mockUsersService();
    let stubAdd = sinon.stub(usersService, "add");
    stubAdd.callsArgWith(1, undefined);
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
                t.true(stubAdd.called, "Called UserService.add");
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, 0, "Operation completed successfully");
                server.stop(t.end);
            });
        }))
});

test("UsersPlugin/users/abc DELETE - Should remove user", function(t) {
    //Arrange
    let usersService = mockUsersService();
    let stubRemove = sinon.stub(usersService, "remove");
    stubRemove.callsArgWith(1, undefined);
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "DELETE",
        url: "/users/abc",
        credentials: { scope: ["admin"] }
    }

    //Act
    TestUtils.createTestServer(8989, [usersPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubRemove.called, "Called UserService.remove");
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, 0, "Operation completed successfully");
                server.stop(t.end);
            });
        }))
});

test("UsersPlugin/password - Should set a new password for calling user", function(t) {
    //Arrange
    let user = {
        username: "User1",
        password: "Ananas",
        scope: ["normal"]
    };
    let newPassword = "Bananaapple!";

    let usersService = mockUsersService();
    let stubGet = sinon.stub(usersService, "get")
    stubGet.callsArgWith(1, undefined, user);
    let stubAdd = sinon.stub(usersService, "add");
    stubAdd.callsArgWith(1, undefined);
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "POST",
        url: "/password",
        payload: {
            newPassword: newPassword
        },
        credentials: {
            username: "User1",
            scope: ["normal"]
        }
    }

    //Act
    TestUtils.createTestServer(8989, [usersPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubGet.called, "Called UserService.get");
                t.equal(stubGet.firstCall.args[0], user.username, "Called UserService.get with correct username");
                t.true(stubAdd.called, "Called UserService.add");
                t.equal(stubAdd.firstCall.args[0].password, newPassword, "Called UserService.add with correct new password");
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, 0, "Operation completed successfully");
                server.stop(t.end);
            });
        }))
});