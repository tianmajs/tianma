"use strict";

var expect = require('chai').expect;
var Response = require('../lib/response');
var deepEqual = require('deep-equal');

describe('ctx.response',function (){
    var response = null;
    beforeEach(function (){
        response = new Response({});
    });

    describe('ctx.response.cookie()',function (){
        it('should set cookie',function (){
            response.cookie('a','1');
            expect(deepEqual(response.head('set-cookie'),['a=1'])).to.equal(true);
        });

        it('should set cookie with options',function (){
            response.cookie('a','1',{
                maxAge: 1000,
                secure: true,
                httpOnly: true
            });
            expect(deepEqual(response.head('set-cookie'),[ 'a=1; Max-Age=1000; HttpOnly; Secure' ])).to.equal(true);
        });
    });

    describe('ctx.response.status()',function (){
        it('should get default status',function (){
            expect(response.status()).to.equal(200);
        });

        it('should set correct status',function (){
            response.status(404);
            expect(response.status()).to.equal(404);
        });
    });
});

