var assert = require('assert'),
	listener = require('../lib/listener'),
	stream = require('stream'),
	util = require('../lib/util');

var FakedRequest = util.inherit(stream.Readable, {
		_initialize: function (config) {
			stream.Readable.call(this);

			config = config || {};

			this.url = config.url || '/';
			this.method = config.method || 'GET';
			this.headers = config.headers || {};
			this._data = config.data || null;

			this.connection = {};
			this.client = {
				remoteAddress: '127.0.0.1'
			};
		},

		_read: function () {
			if (this._data !== null) {
				this.push(this._data);
				this._data = null;
			} else {
				this.push(null);
			}
		},

		destroy: function () {}
	}),

	FakedResponse = util.inherit(Object, {
		end: function (body) {
			this.data = body;
		},

		writeHead: function (status, headers) {
			this.statusCode = status;
			this.headers = headers;
		}
	});

describe('listener', function () {
	it('should handle a request', function (done) {
		var fn = listener.create({
				charset: 'utf8',
				detailedError: false,
				maxRequestLength: 1024 * 1024
			}, function (err, res) {
				assert.equal(err, null);
				assert.equal(res.headers['X-Foo'], 'foo');
				assert.equal(res.data, 'bar');
				done();
			}).mount('/', function (context) {
				var req = context.request,
					res = context.response;

				res.status(200)
					.head('x-foo', req.head('x-foo'))
					.data(req.data());
			}),
			request = new FakedRequest({
				headers: {
					'x-foo': 'foo'
				},
				data: 'bar'
			}),
			response = new FakedResponse();

		fn(request, response);
	});

	it('should deal with errors', function (done) {
		var fn = listener.create({
				charset: 'utf8',
				detailedError: true,
				maxRequestLength: 1024 * 1024
			}, function (err, res, req) {
				assert.equal(err instanceof Error, true);
				assert.equal(err.message, 'BOOM!');
				assert.equal(res.statusCode, 500);
				assert.equal(res.data.split('\n')[0], 'Error: BOOM!');
				done();
			}).mount('/', function (context) {
				throw new Error('BOOM!');
			}),
			request = new FakedRequest(),
			response = new FakedResponse();

		fn(request, response);
	});

	it('should limit request size', function (done) {
		var fn = listener.create({
				charset: 'utf8',
				detailedError: false,
				maxRequestLength: 0
			}, function (err, res, req) {
				assert.equal(err instanceof Error, true);
				assert.equal(err.message, 'Request size limit reached');
				assert.equal(res.statusCode, 500);
				assert.equal(res.data, '');
				done();
			}).mount('/', []),
			request = new FakedRequest({
				data: '...'
			}),
			response = new FakedResponse();

		fn(request, response);
	});

	it('should reject malformed URL', function (done) {
		var fn = listener.create({
				charset: 'utf8',
				detailedError: false,
				maxRequestLength: 1024
			}, function (err, res, req) {
				assert.equal(err instanceof Error, true);
				assert.equal(err.message, 'URI malformed');
				done();
			}).mount('/', []),
			request = new FakedRequest({
				url: '/%ff'
			}),
			response = new FakedResponse();

		fn(request, response);
	});

	it('should provide the loop agent', function (done) {
		var fn = listener.create({
				charset: 'utf8',
				detailedError: false,
				maxRequestLength: 1024
			}, function (err, res, req) {
				assert.equal(err, null);
				assert.equal(res.data, 'bar');
				done();
			}).mount('/foo', function (context, next) {
				context.request('loop://localhost/bar', function (err, res) {
					context.response = res;
					next();
				});
			}).mount('/bar', function (context) {
				context.response.data('bar');
			}),
			request = new FakedRequest({
				url: '/foo'
			}),
			response = new FakedResponse();

		fn(request, response);
	});
});