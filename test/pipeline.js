var assert = require('assert'),
	Pipeline = require('../lib/pipeline');

describe('Pipeline.compareTo', function () {
	it('should compare hostname first', function () {
		var pipelineA = new Pipeline({
				hostname: '*.hostname',
				pathname: '/foo'
			}),
			pipelineB = new Pipeline({
				hostname: '?.hostname',
				pathname: '/?'
			}),
			pipelineC = new Pipeline({
				hostname: 'sub.hostname',
				pathname: '/*'
			});

		assert.equal(pipelineA.compareTo(pipelineB), 1);
		assert.equal(pipelineC.compareTo(pipelineB), -1);
		assert.equal(pipelineB.compareTo(pipelineB), 0);
	});

	it('should compare pathname secondly', function () {
		var pipelineA = new Pipeline({
				hostname: 'hostname',
				pathname: '/*'
			}),
			pipelineB = new Pipeline({
				hostname: 'hostname',
				pathname: '/?'
			}),
			pipelineC = new Pipeline({
				hostname: 'hostname',
				pathname: '/foo'
			});

		assert.equal(pipelineA.compareTo(pipelineB), 1);
		assert.equal(pipelineC.compareTo(pipelineB), -1);
		assert.equal(pipelineB.compareTo(pipelineB), 0);
	});
});

describe('Pipeline.match', function () {
	it('should match the correct hostname and pathname', function () {
		var pipeline = new Pipeline({
				hostname: 'i*.hostname',
				pathname: '/ba?'
			});

		assert.equal(pipeline.match({
			hostname: 'i01.hostname',
			pathname: '/bar'
		}), true);

		assert.equal(pipeline.match({
			hostname: 'm.hostname',
			pathname: '/bar'
		}), false);

		assert.equal(pipeline.match({
			hostname: 'i01.hostname',
			pathname: '/foo'
		}), false);
	});
});

describe('Pipeline.process', function () {
	it('should execute the filters in sequence', function (done) {
		var pipeline = new Pipeline({
				filters: [
					function (context, next) {
						context.foo = 'foo';
						next();
					},
					function (context) {
						context.bar = 'bar';
					}
				]
			});

		pipeline.process({}, function (err, context) {
			assert.equal(context.foo, 'foo');
			assert.equal(context.bar, 'bar');
			done();
		});
	});

	it('should catch the thrown error object', function () {
		var pipeline = new Pipeline({
				filters: [
					function (context) {
						throw 'foo';
					}
				]
			});

		pipeline.process({}, function (err, context) {
			assert.equal(err instanceof Error, true);
		});
	});

	it('should catch the returned error object', function (done) {
		var pipeline = new Pipeline({
				filters: [
					function (context, next) {
						next(new Error());
					}
				]
			});

		pipeline.process({}, function (err, context) {
			assert.equal(err instanceof Error, true);
			done();
		});
	});
});