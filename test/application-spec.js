"use strict";

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

    describe('generate verb', function() {
        it('should find pugins', function() {
            var toCamelFn = tianma.__get__('toCamel');
            var verb = tianma.__get__('verb');
            var verbKeys = Object.keys(verb);
            var devDeps = require('../package.json').devDependencies;
            
            Object.keys(devDeps).filter(function(module) {
                return module.match(/^tianma-.*/);
            }).map(function(module) {
                return toCamelFn(module.replace('tianma-', ''));
            }).every(function(module) {
                return verbKeys.indexOf(module) !== -1;
            }).should.be.true;
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
                (res.headers['content-length'] === undefined).should.be.true;
                done();
            })
    });

    it('should return http code 200(default)', function(done) {
        request(app.run)
            .get('/anypath')
            .expect(200)
            .end(done);
    });

    it('should return http code 500 when throw exception ', function(done) {
        var err = new Error('test');
        app.use(function*(next) {
            yield next;
            throw err;
        });
        request(app.run)
            .get('/anypath')
            .expect(500)
            .expect(err.stack)
            .end(done);
    });

    it('should return correct response status ', function(done) {
        app.use(function*(next) {
            yield next;
            this.response.status(404);
        });
        request(app.run)
            .get('/path')
            .expect(404)
            .end(done);
    });

    it('should return correct response content', function(done) {
        app.use(function*(next) {
            yield next;
            this.response.data('content');
        });
        request(app.run)
            .get('/path')
            .expect('content')
            .end(done);
    });
});
