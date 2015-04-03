"use strict";

var Message = require('../lib/message');
var should = require('should');

describe('constructor', function (){
    it('should create a new message instance', function (){
        var message = new Message({
            headers: {},
            data: [new Buffer(0)]
        });
        message.should.be.an.instanceOf(Message).and.have.property('__');
    });
});

describe('the base class of ctx.request/response', function (){
    var message = null;
    beforeEach(function (){
        message = new Message({
            headers: {},
            data: [new Buffer(0)]
        });
    });

    describe('head()', function (){
        describe('set header', function (){
            it('should set one field when uppercase', function (){
                // upper to lower
                message.head('Accept-Encoding','gzip');
                message.head('accept-encoding').should.equal('gzip');
            });

            it('should set one field when array', function (){
                var arr = ['key1=value1','key2=value2'];
                message.head('set-cookie',arr);
                message.head('set-cookie').should.eql(arr);
            });

            it('should remove one field', function (){
                message.head('cache-control','');
                message.head('cache-control').should.equal('');
            });

            it('should set multiple fields', function (){
                var setting = {
                    'cache-control': 'max-age=0',
                    'if-modified-since': 'Sat, 29 Oct 1994 19:43:31 GMT'
                };
                message.head(setting);
                message.head('cache-control').should.equal(setting['cache-control']);
                message.head('if-modified-since').should.equal(setting['if-modified-since']);
            });
        });

        describe('get header', function (){
            it('should get one field', function (){
                message.head('cache-control','max-age=1000');
                message.head('cache-control').should.equal('max-age=1000');
            });

            it('should get all fields', function (){
                var setting = {
                    'cache-control': 'max-age=0',
                    'if-modified-since': 'Sat, 29 Oct 1994 19:43:31 GMT'
                };
                message.head(setting);
                message.head().should.eql(setting);
            });
        });
    });

    describe('type()', function (){
        it('should return correct type', function (){
            message.head('content-type','text/html; charset=utf-8');
            message.type().should.equal('text/html');
        });

        it('should return empty ', function (){
            message.type().should.equal('');
        });

        it('should set the type', function (){
            message.type('application/json;charset=utf-8');
            message.type().should.equal('application/json');
        });
    });

    describe('is()', function (){
        it('should match when pass a string ', function (){
            message.type('text/html');
            message.is('html').should.equal('html');
        });

        it('should match when pass a array ', function (){
            message.type('text/html');
            message.is(['html','json']).should.equal('html');
        });
    });

    describe('data()', function (){
        it('should return an buffer object', function (){
            message.data('hello world');
            message.data().should.be.an.instanceOf(Buffer);
        });

        it('should return correct data when pass a string object', function (){
            var value = 'hello world';
            message.data(value);
            Buffer.compare(message.data(),new Buffer(value)).should.equal(0);
        });

        it('should return correct data when pass a buffer object', function (){
            var value = 'hello world';
            var buf = new Buffer(value);
            message.data(buf);
            Buffer.compare(message.data(),new Buffer(value)).should.equal(0);
        });

        it('should return correct data when pass an array of strings', function (){
            var value = ['hello','world'];
            message.data(value);
            Buffer.compare(message.data(),new Buffer(value.join(''))).should.equal(0);
        });

        it('should return correct data when pass an array of buffers', function (){
            var bufArray = [new Buffer('hello'),new Buffer('world')];
            message.data(bufArray);
            Buffer.compare(message.data(),Buffer.concat(bufArray)).should.equal(0);
        });
    });

});

