"use strict";

var Request = require('../lib/request');
var should = require('should');

describe('constructor', function (){
    it('should create a new request instance', function (){
        var request = new Request({
            url: 'http://i.alicdn.com',
            method: 'GET',
            headers: {},
            data: [new Buffer(0)]
        });
        request.should.be.an.instanceOf(Request);
    });
});

describe('ctx.request', function (){
    var request = null;
    beforeEach(function (){
        request = new Request({
            url: 'http://i.alicdn.com',
            method: 'GET',
            headers: {},
            data: [new Buffer(0)]
        });
    });

    describe('ctx.request.cookie(name)', function (){
        it('should get cookie', function (){
            request.head('cookie','a=aaaa;b=bbbb');
            request.cookie('b').should.equal('bbbb');
        });

        it('should return empty when cookie isn\'t exist', function (){
            request.cookie('cname').should.equal('');
        });
    });

    describe('ctx.request.method()', function (){
        it('should get correct method', function (){
            request.method('post');
            request.method().should.equal('POST');
        });
    });

    describe('ctx.request.ip()', function (){
        it('should get default ip', function (){
            request.ip().should.equal('0.0.0.0');
        });

        it('should return correct ip', function (){
            request.ip('10.10.10.10');
            request.ip().should.equal('10.10.10.10');
        });
    });

    describe('ctx.request.url()', function (){
        it('should slashes denote to host', function (){
            request.url('//localhost:8080/a');
            request.url().should.equal('http://localhost:8080/a');
        });

        describe('get url props from ctx.request', function (){
            beforeEach(function (){
                request.url('http://user:pass@www.alibaba.com/p/a/t/h?query=string#hash');
            });

            it('should get protocol', function (){
                request.protocol.should.equal('http:');
            });
            it('should get auth', function (){
                request.auth.should.equal('user:pass');
            });

            it('should get host', function (){
                request.host.should.equal('www.alibaba.com');
            });

            it('should get port', function (){
                request.port.should.equal('');
            });

            it('should get hostname', function (){
                request.hostname.should.equal('www.alibaba.com');
            });

            it('should get pathname', function (){
                request.pathname.should.equal('/p/a/t/h');
            });

            it('should get search', function (){
                request.search.should.equal('?query=string');
            });

            it('should get path', function (){
                request.path.should.equal('/p/a/t/h?query=string');
            });

            it('should get hash', function (){
                request.hash.should.equal('#hash');
            });
        });
    });

    describe('ctx.request.query', function (){
        it('should get a query object', function (){
            request.url('http://localhost:8080/a/b/c?time=1212323&debug=true');
            request.query.should.be.type('object').and.have.property('debug','true');
        });

        it('should get a empty object', function (){
            request.url('http://localhost:8080/a/b/c');
            request.query.should.be.type('object');
        });
    });

    describe('ctx.request.accepts*', function (){
        it('should return all accepts', function (){
            request.head('accept','text/html,application/xml,*/*');
            request.accepts().should.eql(['text/html','application/xml','*/*']);
        });

        it('should return false when accept is not populated', function (){
            request.head('accept','text/html,application/xml');
            request.accepts('png').should.be.an.false;
        });
    });


});

