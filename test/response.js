var assert = require('assert'),
	Response = require('../lib/response');

describe('Response.ctor', function () {
	it('should accept a config object', function () {
		var config = {
				status: 200
			},
			res = new Response(config);

		assert.equal(res.status(), config.status);
	});

	it('should have a default configuration', function () {
		var res = new Response();

		assert.equal(res.status(), 404);
	});
});

describe('Response.status', function () {
	it('should return the current status code', function () {
		var config = {
				status: 200
			},
			res = new Response(config);

		assert.equal(res.status(), config.status);
	});

	it('should change the status code', function () {
		var res = new Response();

		assert.equal(res.status(500), res, 'chaining');
		assert.equal(res.status(), 500);
	});
});