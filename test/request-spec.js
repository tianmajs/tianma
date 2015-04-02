"use strict";

var expect = require('chai').expect;
var Request = require('../lib/request');
var deepEqual = require('deep-equal');

describe('ctx.request',function (){
    var request = null;
    beforeEach(function (){
        request = new Request({
            url: 'http://i.alicdn.com',
            method: 'GET',
            headers: {},
            data: [new Buffer(0)]
        });
    });

    describe('ctx.request.cookie(name)',function (){
        it('should get cookie',function (){
            request.head('cookie','a=aaaa;b=bbbb');
            expect(request.cookie('b')).to.equal('bbbb');
        });

        it('should return empty when cookie isn\'t exist',function (){
            expect(request.cookie('cname')).to.equal('');
        });
    });

    describe('ctx.request.method()',function (){
        it('should get correct method',function (){
            request.method('post');
            expect(request.method()).to.equal('POST');
        });
    });

    describe('ctx.request.ip()',function (){
        it('should get default ip',function (){
            expect(request.ip()).to.equal('0.0.0.0');
        });

        it('should return correct ip',function (){
            request.ip('10.10.10.10');
            expect(request.ip()).to.equal('10.10.10.10');
        });
    });

    describe('ctx.request.url()',function (){
        it('should slashes denote to host',function (){
            request.url('//localhost:8080/a');
            expect(request.url()).to.equal('http://localhost:8080/a');
        });

        // necessary?
        describe('get url props from ctx.request',function (){
            beforeEach(function (){
                request.url('http://user:pass@www.alibaba.com/p/a/t/h?query=string#hash');
            });

            it('should get protocol',function (){
                expect(request.protocol).to.equal('http:');
            });
            it('should get auth',function (){
                expect(request.auth).to.equal('user:pass');
            });

            it('should get host',function (){
                expect(request.host).to.equal('www.alibaba.com');
            });

            it('should get port',function (){
                expect(request.port).to.equal('');
            });

            it('should get hostname',function (){
                expect(request.hostname).to.equal('www.alibaba.com');
            });

            it('should get pathname',function (){
                expect(request.pathname).to.equal('/p/a/t/h');
            });

            it('should get search',function (){
                expect(request.search).to.equal('?query=string');
            });

            it('should get path',function (){
                expect(request.path).to.equal('/p/a/t/h?query=string');
            });

            it('should get hash',function (){
                expect(request.hash).to.equal('#hash');
            });
        });
    });

    describe('ctx.request.query',function (){
        it('should get a query object',function (){
            request.url('http://localhost:8080/a/b/c?time=1212323&debug=true');
            expect(request.query).to.be.a('object');
            expect(request.query['debug']).to.equal('true');
        });

        it('should get a empty object',function (){
            request.url('http://localhost:8080/a/b/c');
            expect(request.query).to.be.a('object');
            expect(Object.keys(request.query)).to.have.length(0);
        });
    });

    describe('ctx.request.accepts*',function (){
        it('should return all accepts',function (){
            request.head('accept','text/html,application/xml,*/*');
            expect(deepEqual(request.accepts(),['text/html','application/xml','*/*'])).to.equal(true);
        });

        it('should return false when accept is not populated',function (){
            request.head('accept','text/html,application/xml');
            expect(request.accepts('png')).to.equal(false);
        });
    });


});

