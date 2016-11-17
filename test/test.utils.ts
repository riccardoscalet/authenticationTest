import * as Hapi from "hapi";
const authBasic = require("hapi-auth-basic");

/**
 * Creates server, set basic authentication that is always true, registers all plugins, and then starts the server.
 * 
 * @export
 * @param {number} port
 * @param {any[]} plugins
 * @param {(err: any, server: Hapi.Server) => void} callback
 * @returns
 */
export function createTestServer(
    port: number,
    plugins: any[],
    callback: (err: any, server: Hapi.Server) => void) {

    let server = new Hapi.Server();

    server.connection({ port: port });

    server.register(authBasic, function (err) {
        if (err) throw err;
        server.auth.strategy("basicAuth", "basic", {
            validateFunc: function (request, username, password, callback) {
                callback(undefined, true, { username: username });
            }
        });

        server.auth.default({ strategies: ["basicAuth"] });

        server.register(plugins, function (err) {
            if (err) throw err;
            server.start(function (err) {
                if (err) throw err;
                callback(undefined, server);
            })
        });

    });

    return server;
}