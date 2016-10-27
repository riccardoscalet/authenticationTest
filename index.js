#! /usr/bin/env node

'use strict'

const Hapi = require('hapi')
const xtend = require('xtend')
const minimist = require('minimist')
const levelup = require('levelup');
const defaults = {
    port: 8989
}
var loginPlugin = require('./plugins/loginplugin');

function build(opts, cb) {
    opts = xtend(defaults, opts)

    const server = new Hapi.Server()

    var db = levelup("./user.db");
    var loginPluginObj = new loginPlugin.LoginPlugin({
        db: db
    });

    server.connection({
        port: opts.port
    })

    // Registers plugins to expose on server
    server.register(
        [{
            register: loginPluginObj.register
        }], (err) => {
            cb(err, server)
        })

    return server
}

function start(opts) {
    build(opts, (err, server) => {
        if (err) {
            throw err
        }

        server.start(function (err) {
            if (err) {
                throw err
            }

            console.log('Server running at:', server.info.uri)
        })
    })
}

module.exports = build

if (require.main === module) {
    start(minimist(process.argv.slice(2), {
        integer: 'port',
        alias: {
            'port': 'p'
        }
    }))
}