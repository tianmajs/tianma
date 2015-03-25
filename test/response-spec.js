"use strict";

var expect = require('chai').expect;
var Response = require('../lib/response');
var deepEqual = require('deep-equal');

describe('ctx.response',function (){
    var response = null;
    beforeEach(function (done){
        response = new Response({});
        done();
    });

    describe('ctx.response.cookie()',function (){
        it('should set cookie',function (done){
            response.cookie('a','1');
            expect(deepEqual(response.head('set-cookie'),['a=1'])).to.equal(true);
            done();
        });
        it('should set cookie with options',function (done){
            response.cookie('a','1',{
                maxAge: 1000,
                secure: true,
                httpOnly: true
            });
            expect(deepEqual(response.head('set-cookie'),[ 'a=1; Max-Age=1000; HttpOnly; Secure' ])).to.equal(true);
            done();
        });
    });
    describe('ctx.response.status()',function (){
        it('should get default status',function (done){
            expect(response.status()).to.equal(200);
            done();
        });
        it('should set correct status',function (done){
            response.status(404);
            expect(response.status()).to.equal(404);
            done();
        });
    });



});

