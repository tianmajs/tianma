var assert = require('assert'),
	Message = require('../lib/message');

describe('Message.ctor', function () {
	it('should accept a config object', function () {
		var config = {
				headers: {},
				data: new Buffer(0),
				charset: 'binary'
			},
			msg = new Message(config);

		assert.equal(msg.head(), config.headers);
		assert.equal(msg.binary, config.data);
		assert.equal(msg.charset(), config.charset);
	});

	it('should have a default configuration', function () {
		var msg = new Message();

		assert.equal(Object.keys(msg.head()).length, 0);
		assert.equal(msg.data(), '');
		assert.equal(msg.charset(), 'utf8');
	});
});

describe('Message.binary', function () {
	it('should return the current data in buffer format', function () {
		var config = {
				data: new Buffer(0),
			},
			msg = new Message(config);

		assert.equal(msg.binary, config.data);
	});

	it('should convert string to buffer at first', function () {
		var config = {
				data: 'Hello',
			},
			msg = new Message(config);

		assert(msg.binary instanceof Buffer);
		assert.equal(msg.binary.toString(), 'Hello');
	});

	it('should be read-only', function () {
		var msg = new Message({
				data: 'Hello'
			});

		msg.binary = 'World';

		assert.equal(msg.binary.toString(), 'Hello');
	});
});

describe('Message.charset', function () {
	it('should return the current charset', function () {
		var msg = new Message({
				charset: 'utf8'
			});

		assert.equal(msg.charset(), 'utf8');
	});

	it('should change the charset', function () {
		var msg = new Message({
				data: new Buffer([ 0xD6, 0xD0, 0xCE, 0xC4 ])
			});

		assert.equal(msg.charset('gbk'), msg, 'chaining');
		assert.equal(msg.charset(), 'gbk');
		assert.equal(msg.data(), '中文')
	});
});

describe('Message.data', function () {
	it('should return the current data in string format', function () {
		var msg = new Message({
				data: 'Hello'
			});

		assert.equal(msg.data(), 'Hello');
	});

	it('should convert buffer to string at first', function () {
		var msg = new Message({
				data: new Buffer('Hello')
			});

		assert.equal(msg.data(), 'Hello');
	});

	it('should change the data with a string', function () {
		var msg = new Message();

		assert.equal(msg.data('World'), msg, 'chaining');
		assert.equal(msg.data(), 'World');
	});

	it('should change the data with a buffer', function () {
		var msg = new Message();

		assert.equal(msg.data(new Buffer('World')), msg, 'chaining');
		assert.equal(msg.data(), 'World');
	});
});

describe('Message.head', function () {
	it('should return the value of a single header field', function () {
		var msg = new Message({
				headers: {
					'foo': 'x'
				}
			});

		assert.equal(msg.head('foo'), 'x');
	});

	it('should change the value of a single header field', function () {
		var msg = new Message({
				headers: {
					'foo': 'x'
				}
			});

		assert.equal(msg.head('foo', 'y'), msg, 'chaining');
		assert.equal(msg.head('foo'), 'y');
	});

	it('should return the whole header', function () {
		var config = {
				headers: {
					'foo': 'x'
				}
			},
			msg = new Message(config);

		assert.equal(msg.head(), config.headers);
	});

	it('should change the whole header', function () {
		var headers = {
				'foo': 'x'
			},
			msg = new Message();

		assert.equal(msg.head(headers), msg, 'chaining');
		assert.equal(msg.head(), headers);
	});
});
