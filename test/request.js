var assert = require('assert'),
	Request = require('../lib/request');

describe('Request.ctor', function () {
	it('should accept a config object', function () {
		var config = {
				method: 'POST',
				from: '127.0.0.1',
				url: 'http://localhost/'
			},
			req = new Request(config);

		assert.equal(req.method(), config.method);
		assert.equal(req.from(), config.from);
		assert.equal(req.url(), config.url);
	});

	it('should have a default configuration', function () {
		var req = new Request();

		assert.equal(req.method(), 'GET');
		assert.equal(req.from(), '0.0.0.0');
		assert.equal(req.url(), '/');
	});
});

describe('Request.method', function () {
	it('should return the current method', function () {
		var config = {
				method: 'POST'
			},
			req = new Request(config);

		assert.equal(req.method(), config.method);
	});

	it('should change the method', function () {
		var req = new Request();

		assert.equal(req.method('PUT'), req, 'chaining');
		assert.equal(req.method(), 'PUT');
	});
});

describe('Request.from', function () {
	it('should return the current sender', function () {
		var config = {
				from: '127.0.0.1'
			},
			req = new Request(config);

		assert.equal(req.from(), config.from);
	});

	it('should change the sender', function () {
		var req = new Request();

		assert.equal(req.from('127.0.0.1'), req, 'chaining');
		assert.equal(req.from(), '127.0.0.1');
	});
});

describe('Request.url', function () {
	it('should return the current URL', function () {
		var config = {
				url: 'protocol://au:th@hostname:8080/pa/th?search=string'
			},
			req = new Request(config);

		assert.equal(req.url(), config.url);
	});

	it('should change the URL with a full one', function () {
		var req = new Request(),
			url = 'protocol://au:th@hostname:8080/pa/th?search=string';

		assert.equal(req.url(url), req, 'chaining');
		assert.equal(req.url(), url);
		assert.equal(req.protocol, 'protocol:');
		assert.equal(req.auth, 'au:th');
		assert.equal(req.hostname, 'hostname');
		assert.equal(req.port, '8080');
		assert.equal(req.host, 'hostname:8080');
		assert.equal(req.pathname, '/pa/th');
		assert.equal(req.search, '?search=string');
		assert.equal(req.path, '/pa/th?search=string');
		assert.equal(req.query.search, 'string');
	});

	it('should change the URL with a protocol', function () {
		var req = new Request({
				url: 'protocol://au:th@hostname:8080/pa/th?search=string'
			});

		assert.equal(req.url('http:'), req, 'chaining');
		assert.equal(req.url(),
			'http://au:th@hostname:8080/pa/th?search=string');
		assert.equal(req.protocol, 'http:');
	});

	it('should change the URL with a host', function () {
		var req = new Request({
				url: 'protocol://au:th@hostname:8080/pa/th?search=string'
			});

		assert.equal(req.url('//user:pass@'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://user:pass@hostname:8080/pa/th?search=string');
		assert.equal(req.auth, 'user:pass');

		assert.equal(req.url('//foo.com'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://user:pass@foo.com:8080/pa/th?search=string');
		assert.equal(req.hostname, 'foo.com');

		assert.equal(req.url('//:1080'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://user:pass@foo.com:1080/pa/th?search=string');
		assert.equal(req.port, '1080');

		assert.equal(req.url('//au:th@hostname:8080'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://au:th@hostname:8080/pa/th?search=string');
		assert.equal(req.host, 'hostname:8080');
	});

	it('should change the URL with a path', function () {
		var req = new Request({
				url: 'protocol://au:th@hostname:8080/pa/th?search=string'
			});

		assert.equal(req.url('/foo/bar'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://au:th@hostname:8080/foo/bar?search=string');
		assert.equal(req.pathname, '/foo/bar');

		assert.equal(req.url('?k=v'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://au:th@hostname:8080/foo/bar?k=v');
		assert.equal(req.search, '?k=v');
		assert.equal(req.query.k, 'v');

		assert.equal(req.url('/pa/th?search=string'), req, 'chaining');
		assert.equal(req.url(),
			'protocol://au:th@hostname:8080/pa/th?search=string');
		assert.equal(req.path, '/pa/th?search=string');
	});

	it('should be read-only for all partial URL properties', function () {
		var req = new Request({
				url: 'protocol://au:th@hostname:8080/pa/th?search=string'
			});

		req.protocol
			= req.auth = req.hostname = req.port
			= req.host = req.pathname = req.search
			= req.path = req.query = null;

		assert.equal(req.protocol, 'protocol:');
		assert.equal(req.auth, 'au:th');
		assert.equal(req.hostname, 'hostname');
		assert.equal(req.port, '8080');
		assert.equal(req.host, 'hostname:8080');
		assert.equal(req.pathname, '/pa/th');
		assert.equal(req.search, '?search=string');
		assert.equal(req.path, '/pa/th?search=string');
		assert.equal(req.query.search, 'string');
	});

	it('should parse file: protocol', function () {
		assert.equal(new Request({
			url: 'file:///pa/th/'
		}).host, '');

		assert.equal(new Request({
			url: 'file://./pa/th'
		}).host, '.');

		assert.equal(new Request({
			url: 'file://c/pa/th'
		}).host, 'c');
	});
});

describe('request()', function () {
	it('should handle request per protocol', function () {
		var req = new Request({}, {
				'foo:': function (req, res, callback) {
					callback('foo');
				},
				'bar:': function (req, res, callback) {
					callback('bar');
				}
			});

		req('foo://foo', function (ret) {
			assert.equal(ret, 'foo');
		});

		req('bar://bar', function (ret) {
			assert.equal(ret, 'bar');
		});
	});

	it('should create the request object by option', function () {
		var request = new Request({}, {
				'http:': function (req, res, callback) {
					callback(req, res);
				}
			}),
			option = {
				method: 'POST',
				url: 'http://example.com/foo/bar',
				headers: {},
				data: new Buffer('Hello')
			};

		request(option, function (req) {
			assert.equal(req.url(), option.url);
			assert.equal(req.method(), option.method);
			assert.equal(req.from(), request.from());
			assert.equal(req.charset(), request.charset());
			assert.equal(req.head(), option.headers);
			assert.equal(req.binary, option.data)
		});
	});

	it('should create the request object by url', function () {
		var request = new Request({}, {
				'http:': function (req, res, callback) {
					callback(req, res);
				}
			}),
			url = 'http://example.com/foo/bar';

		request(url, function (req) {
			assert.equal(req.url(), url);
			assert.equal(req.method(), 'GET');
			assert.equal(Object.keys(req.head()).length, 0);
			assert.equal(req.data(), '')
		});
	});

	it('should use the current request object', function () {
		var request = new Request({
				url: 'http://example.com/foo/bar'
			}, {
				'http:': function (req, res, callback) {
					callback(req, res);
				}
			});

		request(function (req) {
			assert.equal(req.url(), request.url());
			assert.equal(req.method(), request.method());
			assert.equal(req.from(), request.from());
			assert.equal(req.charset(), request.charset());
			assert.equal(req.head(), request.head());
			assert.equal(req.binary, request.binary);
		});
	});
});