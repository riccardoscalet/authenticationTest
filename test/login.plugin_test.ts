const test = require("tape");
import * as sinon from "sinon";

import * as Hapi from "hapi";
import * as TestUtils from "./test.utils";

import { LoginPlugin } from "../plugins/login.plugin";
import { UsersService } from "../services/users.service";


function mockUsersService(): any {
    return {
        get: () => void {},
        add: () => void {},
        remove: () => void {},
        getAll: () => void {},
        validateCredentials: () => void {},
        errorCodeToMessage: () => void {}
    }
}

test("LoginPlugin/login - With valid credentials - Should return token", function(t) {
    //Arrange
    let user = {
        username: "PinkyPrettyPrincess",
        password: "Wow that's a bold username!",
        email: "burp@beer.com"
    }

    let usersService = mockUsersService();
    let stubValidate = sinon.stub(usersService, "validateCredentials");
    stubValidate.withArgs(user.username, user.password).callsArgWith(2,
        undefined, true, user);
    let loginPlugin: LoginPlugin = new LoginPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "POST",
        url: "/login",
        payload: {
            username: user.username,
            password: user.password
        }
    }

    //Act
    TestUtils.createTestServer(8989, [loginPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubValidate.called);
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, 0, "Operation completed successfully");
                t.notEqual(response.result.token, undefined, "Token was returned");
                server.stop(t.end);
            });
        }));
});

test("LoginPlugin/login - With bad credentials - Should return error", function(t) {
    //Arrange
    let user = {
        username: "SadSadPanda",
        password: "Sad pandas not allowed, sorry"
    }

    let usersService = mockUsersService();
    let stubValidate = sinon.stub(usersService, "validateCredentials");
    stubValidate.withArgs(user.username, user.password).callsArgWith(2, -3, false);
    let errorCodeToMessage = sinon.stub(usersService, "errorCodeToMessage");
    let loginPlugin: LoginPlugin = new LoginPlugin(usersService);

    let options: Hapi.IServerInjectOptions = {
        method: "POST",
        url: "/login",
        payload: {
            username: user.username,
            password: user.password
        }
    }

    //Act
    TestUtils.createTestServer(8989, [loginPlugin],
        ((err, server) => {
            server.inject(options, function(response: any) {
                //Assert
                t.true(stubValidate.called);
                t.true(errorCodeToMessage.called);
                t.equal(response.statusCode, 200, "Response: OK");
                t.equal(response.result.result, -3, "Operation completed with incorrect password");
                t.equal(response.result.token, undefined, "Token was not returned");
                server.stop(t.end);
            });
        }));
});