"use strict";

var https = require('https');
var fs = require('fs');
var path = require('path');
var rewire = require('rewire');
var request = require('supertest');
var should = require('should');

var tianma = rewire('../lib/application');
var app;

beforeEach(function() {
    app = tianma();
});

describe('tianma private logic', function() {
    describe('toCamel()', function() {
        it('should return origin string', function() {
            var toCamelFn = tianma.__get__('toCamel');
            toCamelFn('demo').should.equal('demo');
        });

        it('should return camel string', function() {
            var toCamelFn = tianma.__get__('toCamel');
            toCamelFn('test-demo').should.equal('testDemo');
        });
    });

    describe('load plugins', function() {
        it('should find pugins', function() {
            var toCamelFn = tianma.__get__('toCamel');
            var verb = tianma.__get__('verb');
            var verbKeys = Object.keys(verb);
            var devDeps = require('../package.json').devDependencies;
            var expectVerbKeys = Object.keys(devDeps).filter(function(module) {
                return module.match(/^tianma-.*/);
            }).map(function(module) {
                return toCamelFn(module.replace('tianma-', ''));
            });
            verbKeys.should.eql(expectVerbKeys);
        });

        it('should have plugin methods', function() {
            var toCamelFn = tianma.__get__('toCamel');
            var verb = tianma.__get__('verb');
            var verbKeys = Object.keys(verb);
            verbKeys.forEach(function(key) {
                app[key].should.be.Function;
            });
        });
    });

});

describe('tianma server', function() {
    it('should not exist header(Content-Length)', function(done) {
        request(app.run)
            .get('/anypath')
            .end(function(err, res) {
                if (err) return done(err);
                (res.headers['content-length']===undefined).should.be.true;
                done();
            })
    });

    it('should return httpCode 200', function(done) {
        request(app.run)
            .get('/anypath')
            .expect(200)
            .end(done);
    });

    it('should return httpCode 500 ', function(done) {
        app.use(function*(next) {
            throw new Error('test');
        });
        request(app.run)
            .get('/anypath')
            .expect(500)
            .end(done);
    });

    it('should return correct response content', function(done) {
        app.use(function*(next) {
            this.response.data(this.request.pathname);
        });
        request(app.run)
            .get('/path')
            .expect('/path')
            .end(done);
    });
});
