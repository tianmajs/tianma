"use strict";

var expect = require('chai').expect;
var Request = require('../lib/request');
var deepEqual = require('deep-equal');

describe('ctx.request',function (){
    var request = null;
    beforeEach(function (done){
        request = new Request({
            url: 'http://i.alicdn.com',
            method: 'GET',
            headers: {},
            data: [new Buffer(0)]
        });
        done();
    });



    describe('ctx.request.cookie(name)',function (){
        it('should get cookie',function (done){
            request.head('cookie','a=aaaa;b=bbbb');
            expect(request.cookie('b')).to.equal('bbbb');
            done();
        });
        it('should return empty when cookie isn\'t exist',function (done){
            expect(request.cookie('cname')).to.equal('');
            done();
        });
    });
    describe('ctx.request.method()',function (){
        it('should get correct method',function (done){
            request.method('post');
            expect(request.method()).to.equal('POST');
            done();
        });
    });
    describe('ctx.request.ip()',function (){
        it('should get default ip',function (done){
            expect(request.ip()).to.equal('0.0.0.0');
            done();
        });
        it('should return correct ip',function (done){
            request.ip('10.10.10.10');
            expect(request.ip()).to.equal('10.10.10.10');
            done();
        });
    });


    describe('ctx.request.url()',function (){
        it('should slashes denote to host',function (done){
            request.url('//localhost:8080/a');
            expect(request.url()).to.equal('http://localhost:8080/a');
            done();
        });
        // necessary?
        describe('get url props from ctx.request',function (){
            beforeEach(function (done){
                request.url('http://user:pass@www.alibaba.com/p/a/t/h?query=string#hash');
                done();
            });

            it('should get protocol',function (done){
                expect(request.protocol).to.equal('http:');
                done();
            });
            it('should get auth',function (done){
                expect(request.auth).to.equal('user:pass');
                done();
            });

            it('should get host',function (done){
                expect(request.host).to.equal('www.alibaba.com');
                done();
            });
            it('should get port',function (done){
                expect(request.port).to.equal('');
                done();
            });
            it('should get hostname',function (done){
                expect(request.hostname).to.equal('www.alibaba.com');
                done();
            });
            it('should get pathname',function (done){
                expect(request.pathname).to.equal('/p/a/t/h');
                done();
            });
            it('should get search',function (done){
                expect(request.search).to.equal('?query=string');
                done();
            });
            it('should get path',function (done){
                expect(request.path).to.equal('/p/a/t/h?query=string');
                done();
            });
            it('should get hash',function (done){
                expect(request.hash).to.equal('#hash');
                done();
            });

        });
    });


    describe('ctx.request.query',function (){
        it('should get a query object',function (done){
            request.url('http://localhost:8080/a/b/c?time=1212323&debug=true');
            expect(request.query).to.be.a('object');
            expect(request.query['debug']).to.equal('true');
            done();
        });
        it('should get a empty object',function (done){
            request.url('http://localhost:8080/a/b/c');
            expect(request.query).to.be.a('object');
            expect(Object.keys(request.query)).to.have.length(0);
            done();
        });
    });

    describe('ctx.request.accepts*',function (){

        it('should return all accepts',function (done){
            request.head('accept','text/html,application/xml,*/*');
            expect(deepEqual(request.accepts(),['text/html','application/xml','*/*'])).to.equal(true);
            done();
        });

        it('should return false when accept is not populated',function (done){
            request.head('accept','text/html,application/xml');
            expect(request.accepts('png')).to.equal(false);
            done();
        });

    });


});

