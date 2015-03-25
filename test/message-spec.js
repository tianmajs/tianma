"use strict";

var expect = require('chai').expect;
var Message = require('../lib/message');
var bufferEqual = require('buffer-equal');
var deepEqual = require('deep-equal');

describe('the base class of ctx.request/response',function (){
    var message = null;
    beforeEach(function (done){
        message = new Message({
            headers: {},
            data: [new Buffer(0)]
        });
        done();
    });

    describe('head()',function (){

        describe('set header',function (){
            it('should set one field with Uppercase',function (done){
                // upper to lower
                message.head('Accept-Encoding','gzip, deflate, sdch');
                expect(message.head('accept-encoding')).to.equal('gzip, deflate, sdch');
                done();
            });

            it('should set one field with array',function (done){
                var arr = ['key1=value1','key2=value2'];
                message.head('set-cookie',arr);
                expect(deepEqual(message.head('set-cookie'),arr)).to.equal(true);
                done();
            });

            it('should remove one field',function (done){
                message.head('cache-control','');
                expect(message.head('cache-control')).to.equal('');
                done();
            });

            it('should set multiple fields',function (done){
                var setting = {
                    'cache-control': 'max-age=0',
                    'if-modified-since': 'Sat, 29 Oct 1994 19:43:31 GMT'
                };
                message.head(setting);
                expect(message.head('cache-control')).to.equal(setting['cache-control']);
                expect(message.head('if-modified-since')).to.equal(setting['if-modified-since']);
                done();
            });
        });

        describe('get header',function (){
            it('should get one field',function (done){
                message.head('cache-control','max-age=1000');
                expect(message.head('cache-control')).to.equal('max-age=1000');
                done();
            });
            it('should get all fields',function (done){
                var setting = {
                    'cache-control': 'max-age=0',
                    'if-modified-since': 'Sat, 29 Oct 1994 19:43:31 GMT'
                };
                message.head(setting);
                expect(deepEqual(message.head(),setting)).to.equal(true);
                done();
            });
        });
    });

    describe('type()',function (){
        it('should return correct type',function (done){
            message.head('content-type','text/html; charset=utf-8');
            expect(message.type()).to.equal('text/html');
            done();
        });

        it('should return empty ',function (done){
            expect(message.type()).to.equal('');
            done();
        });

        it('should set the type',function (done){
            message.type('application/json;charset=utf-8');
            expect(message.type()).to.equal('application/json');
            done();
        });
    });

    describe('is()',function (){
        // necessary ?
    });

    describe('data()',function (){
        it('should return correct data when pass a string object',function (done){
            var value = 'hello world';
            message.data(value);
            expect(bufferEqual(message.data(),new Buffer(value))).to.equal(true);
            done();
        });
        it('should return correct data when pass a buffer object',function (done){
            var value = 'hello world';
            var buf = new Buffer(value);
            message.data(buf);
            expect(bufferEqual(message.data(),new Buffer(value))).to.equal(true);
            done();
        });
        it('should return correct data when pass an array of strings',function (done){
            var value = ['hello','world'];
            message.data(value);
            expect(bufferEqual(message.data(),new Buffer(value.join('')))).to.equal(true);
            done();
        });
        it('should return correct data when pass an array of buffers',function (done){
            var bufArray = [new Buffer('hello'),new Buffer('world')];
            message.data(bufArray);
            expect(bufferEqual(message.data(),Buffer.concat(bufArray))).to.equal(true);
            done();
        });
    });

});

