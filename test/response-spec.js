"use strict";

var Response = require('../lib/response');
var should = require('should');

describe('constructor', function (){
    it('should create a new response instance', function (){
        var response = new Response({
            status: 404
        });
        response.should.be.an.instanceOf(Response);
    });
});

describe('ctx.response', function (){
    var response = null;
    beforeEach(function (){
        response = new Response({});
    });

    describe('ctx.response.cookie()', function (){
        it('should set cookie', function (){
            response.cookie('a','1');
            response.head('set-cookie').should.eql(['a=1']);
        });

        it('should set cookie with options', function (){
            response.cookie('a','1',{
                maxAge: 1000,
                secure: true,
                httpOnly: true
            });
            response.head('set-cookie').should.eql([ 'a=1; Max-Age=1000; HttpOnly; Secure' ]);
        });
    });

    describe('ctx.response.status()', function (){
        it('should get default status', function (){
            response.status().should.equal(200);
        });

        it('should set correct status', function (){
            response.status(404);
            response.status().should.equal(404);
        });
    });
});

