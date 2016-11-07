#! /usr/bin/env node

'use strict'

import * as Hapi from "hapi";
import * as minimist from "minimist";
import * as xtend from "xtend";
const levelup = require("levelup");

import { UsersService } from "./services/users.service";
import { LoginPlugin } from "./plugins/login.plugin";
import { UsersPlugin } from "./plugins/users.plugin";

const defaults = { port: 8989 }

export function build(options, cb) {
    options = xtend(defaults, options)

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
    server.connection({
        port: options.port
    });

    // Registers plugins to expose on server
    server.register(
        [
            loginPlugin,
            usersPlugin
        ], (err) => {
            cb(err, server)
        });

    return server;
}


function start(options) {
    build(options, (err, server) => {
        if (err) throw err;
        server.start(function(err) {
            if (err) throw err;
            console.log(`Server running. Port[${server.info.uri}]`);
        })
    })
}

if (require.main === module) {
    let args = minimist(
        process.argv.slice(2), {
            alias: {
                "port": "p"
            }
        });

    start(args);
}