import * as Hapi from "hapi";
const authBasic = require("hapi-auth-basic");

export function createTestServer(
    port: number,
    callback: (err: any, server: Hapi.Server) => void) {

    let server = new Hapi.Server();

    server.connection({ port: port });

    server.register(authBasic, function(err) {
        server.auth.strategy("basicAuth", "basic", {
            validateFunc: function(request, username, password, callback) {
                callback(undefined, true, { username: username });
            }
        });

        server.auth.default({ strategies: ["basicAuth"] });

        callback(undefined, server)
    });

    return server;
}