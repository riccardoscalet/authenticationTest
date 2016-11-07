#! /usr/bin/env node

import * as minimist from "minimist";
import * as xtend from "xtend";

import { ServerMain } from "./server.main";

const defaults = { port: 8989 }


function start(options) {
    options = xtend(defaults, options);

    let server = ServerMain(
        options,
        (err, server) => {
            if (err) throw err;
            console.log(`Server running. Port[${server.info.uri}]`);
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