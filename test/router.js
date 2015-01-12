var assert = require('assert'),
	Router = require('../lib/router');

describe('Router.pipeline', function () {
	it('should convert a function to the filters array', function () {
		var router = new Router,
			context = {
				request: {
					hostname: '',
					pathname: '/'
				}
			};

		router.mount('/', function (context) {
			context.foo = 'foo';
		});

		router.route(context, function (err, context) {
			assert.equal(context.foo, 'foo');
		});
	});

	it('should accept a filters array', function () {
		var router = new Router,
			context = {
				request: {
					hostname: '',
					pathname: '/'
				}
			};

		router.mount('/', [
			function (context) {
				context.foo = 'foo';
			},
			[
				function (context) {
					context.bar = 'bar';
				},
				function (context) {
					context.baz = 'baz';
				},
			]
		]);

		router.route(context, function (err, context) {
			assert.equal(context.foo, 'foo');
			assert.equal(context.bar, 'bar');
			assert.equal(context.baz, 'baz');
		});
	});

	it('should convert an object to the filters array', function () {
		var router = new Router,
			context1 = {
				request: {
					hostname: '',
					pathname: '/foo'
				}
			},
			context2 = {
				request: {
					hostname: '',
					pathname: '/bar'
				}
			};

		router.mount('/', {
			'/foo': function (context) {
				context.x = 'foo';
			},
			'/bar': function (context) {
				context.x = 'bar';
			},
		});

		router.route(context1, function (err, context) {
			assert.equal(context.x, 'foo');
		});

		router.route(context2, function (err, context) {
			assert.equal(context.x, 'bar');
		});
	});

	it('should accept an router object', function () {
		var router = new Router,
			context1 = {
				request: {
					hostname: '',
					pathname: '/foo'
				}
			},
			context2 = {
				request: {
					hostname: '',
					pathname: '/bar'
				}
			};

		router.mount({
			'/foo': function (context) {
				context.x = 'foo';
			},
			'/bar': function (context) {
				context.x = 'bar';
			},
		});

		router.route(context1, function (err, context) {
			assert.equal(context.x, 'foo');
		});

		router.route(context2, function (err, context) {
			assert.equal(context.x, 'bar');
		});
	});
});

describe('Router.rules', function () {
	it('should accpet various router rules', function () {
		var router = new Router;

		router.mount({
			'/': function (context) {
				context.x = 1;
			},
			'/foo/bar': function (context) {
				context.x = 2;
			},
			'/foo/ba?': function (context) {
				context.x = 3;
			},
			'/*/bar': function (context) {
				context.x = 4;
			},
			'hostname': function (context) {
				context.x = 5;
			},
			'*.hostname': function (context) {
				context.x = 6;
			},
			'i?.hostname': function (context) {
				context.x = 7;
			},
			'hostname/foo/bar': function (context) {
				context.x = 8;
			}
		});

		router.route({
			request: {
				hostname: '127.0.0.1',
				pathname: '/baz/baz/'
			}
		}, function (err, context) {
			assert.equal(context.x, 1);
		});

		router.route({
			request: {
				hostname: '127.0.0.1',
				pathname: '/foo/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 2);
		});

		router.route({
			request: {
				hostname: '127.0.0.1',
				pathname: '/foo/baz/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 3);
		});

		router.route({
			request: {
				hostname: '127.0.0.1',
				pathname: '/baz/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 4);
		});

		router.route({
			request: {
				hostname: 'hostname',
				pathname: '/baz/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 5);
		});

		router.route({
			request: {
				hostname: 'm.hostname',
				pathname: '/baz/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 6);
		});

		router.route({
			request: {
				hostname: 'i3.hostname',
				pathname: '/baz/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 7);
		});

		router.route({
			request: {
				hostname: 'hostname',
				pathname: '/foo/bar/baz'
			}
		}, function (err, context) {
			assert.equal(context.x, 8);
		});
	});
});