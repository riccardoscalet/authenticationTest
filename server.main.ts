import * as Hapi from "hapi";
const levelup = require("levelup");
const authToken = require('hapi-auth-jwt2');

import { UsersService } from "./services/users.service";
import { LoginPlugin } from "./plugins/login.plugin";
import { UsersPlugin } from "./plugins/users.plugin";


export const AuthenticationOptions = {
    authKey: "supersecretpasswordsadaaddsdadsdsadadsaddadsadsadadadd",
    authTtlSeconds: 60 * 60 // Token remains valid for one hour
}


export function ServerMain(options: any, callback: (err: any, server ? : Hapi.Server) => void): Hapi.Server {

    let server = new Hapi.Server();

    // Sets encoding to json. Levelup will take care of all stringify operations.
    let levelupOptions = {
        keyEncoding: "json",
        valueEncoding: "json"
    };
    // Opens/creates levelup db file. Will throw exception in case of error.
    let db: LevelUp = levelup("./user.db", levelupOptions);

    // Creates services and plugins
    let usersService: UsersService = new UsersService(db);
    let loginPlugin: LoginPlugin = new LoginPlugin(usersService);
    let usersPlugin: UsersPlugin = new UsersPlugin(usersService);

    // Sets up server conection
    server.connection({ port: options.port });

    // Configures authentication
    registerAuthenticationStrategies(server);

    // Registers plugins to expose on server
    server.register(
        [
            loginPlugin,
            usersPlugin
        ], (err) => {
            if (err) callback(err);
        });


    server.start(function(err) {
        callback(err, server);
    })

    return server;
}

/**
 * Registers and configures authetication strategies. 
 * 
 * @param {any} server
 */
function registerAuthenticationStrategies(server) {

    // Configures cookie
    server.state("token", {
        path: "/",
        // domain: "localhost",
        encoding: "none",
        ttl: AuthenticationOptions.authTtlSeconds * 1000, // Time-to-live of cookie
        isSecure: false,
        isHttpOnly: false,
        isSameSite: false,
    });

    // Initializes JWT token authentication strategy.
    //      For every subsequent REST call to server, the client can either embed this token into the "Authorization" header,
    //      or send the cookie "token" to the server (browsers do this automatically).
    server.register(authToken, function(err) {
        if (err) throw err;
    });
    server.auth.strategy('jwtAuth', 'jwt', {
        key: AuthenticationOptions.authKey,
        validateFunc: function(decoded, request, callback) {
            // This method is reached only if token is valid.

            return callback(null, true);
        },
        verifyOptions: {
            algorithms: ['HS256']
        },
        cookieKey: "token"
    });

    // Sets default authentications for all server routes.
    server.auth.default({
        strategies: ["jwtAuth"]
    })
}