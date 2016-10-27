'use strict'

const tap = require('tap');
const mymod = require('../hello.js')

var server;

tap.beforeEach((done) => {
    mymod({ port: 8989 }, (err, s) => {
        server = s
        done(err);
    })
});

tap.test('add - ', function(t) {
    //Arrange
    const options = {
        method: 'GET',
        url: '/asset/add?name=aaa'
    }

    //Act
    server.inject(options, function(response) {
        const result = response.result;
        t.equal(result, "Asset added successfully!");
        t.end();
    })
});