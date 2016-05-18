var assert = require('assert'),
    express = require('express'),
    chai=require('chai'),
    chaiHttp = require('chai-http');

var expect = require('chai').expect;
chai.use(chaiHttp);

exports.chai = chai;
exports.expected = expect;


exports.createClient = function(options){
    var client = solr.createClient(options);
    client.on('error', function(e){
        throw new Error('unable to connect to Solr');
    });
    return client;
};


exports.expected = 0;


var count = 0;
var wrapAssert = function(fn) {
    return function() {
        assert[fn].apply(this, arguments);
        count++;
        process.stdout.write('.');
    };
};
exports.assert = {};

// add all functions from the assert module
for (var fn in assert) {
    if (assert.hasOwnProperty(fn)) {
        exports.assert[fn] = wrapAssert(fn);
    }
}

process.on('exit', function() {
    process.stdout.write(' ran ' + count + ' of ' + exports.expected + ' tests.\n');
});
