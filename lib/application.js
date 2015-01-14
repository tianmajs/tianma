'use strict';

var fs = require('fs'),
	http = require('http'),
	milu = require('milu'),
	mc = require('mini-co'),
	mu = require('mini-util'),
	Request = require('./request'),
	Response = require('./response');
	
// Generate the MAGIC chaining method.
var PROTO = (function () {
	var proto = function () {},
		method;
	
	module.paths.forEach(function (p) {
		if (fs.existsSync(p)) {
			fs.readdirSync(p).forEach(function (name) {
				if (name.indexOf('tianma-') === 0) {
					method = toCamel(name.replace('tianma-', ''));
					proto[method] = function () {
						return this.pipe(require(name).apply(null, arguments));
					};
				}
			});
		}
	});
	
	return proto;
}());

/**
 * Convert "foo-bar" to "fooBar".
 * @param name {string}
 * @return {string}
 */
function toCamel(name) {
	name = name.split('-').map(function (part) {
		return part[0].toUpperCase() + part.substring(1);
	}).join('');
	
	name = name[0].toLowerCase() + name.substring(1);
	
	return name;
}

/**
 * Reset the response before/after a filer.
 * @param fn {Function}
 * @return {Function}
 */
function enhance(fn) {
	return function (next, done) {
		var __ = this.response.__;
		
		// Default status.
		__.status = 200;
		
		fn.call(this, function () {
			// Clean up the response.
			__.status = 404;
			__.headers = {};
			__.data = '';
			// Trigger the next filter.
			return next.apply(this, arguments);
		}, done);
	};
}

/**
 * Wrap a filter node.
 * @param listener {Function}
 * @param [filter] {Function}
 * @return {Function}
 */
function wrap(node) {
	node.__proto__ = PROTO;
	
	var original = node.pipe;
	
	node.pipe = function (filter) {
		if (mu.isGenerator(filter)) {
			filter = mc(filter);
		}
		
		filter = enhance(filter);
		
		return wrap(original(filter));
	};
	
	return node;
}

function rootFilter(next, done) {
	var request = this.request,
		response = this.response,
		
		protocol = request.connection.encrypted
			? 'https:' : 'http:',
			
		url = protocol + '//' + request.headers.host
			+ request.url,
			
		req = new Request({
			url: url,
			method: request.method,
			ip: request.client.remoteAddress,
			headers: request.headers,
			data: request
		}),
		
		res = new Response({});
		
	Object.defineProperty(this, 'request', { value: req });
	Object.defineProperty(this, 'response', { value: res });
	
	next(function (err) {
		if (err) {
			response.writeHead(500);
			response.end(err.stack);
		} else {
			response.writeHead(res.status(),
				res.head('content-length', '').head());
			res.data().pipe(response);
		}
		done(err);
	});
}

/**
 * Create the Listener.
 * @param [port] {number}
 * @return {Object}
 */
module.exports = function (port) {
	var root = wrap(milu(rootFilter)),
	
		listener = function (req, res, callback) {
			root({
				request: req,
				response: res
			}, callback);
		};
		
	listener.__proto__ = PROTO;
	listener.pipe = root.pipe.bind(root);

	if (port) {
		http.createServer(listener)
			.listen(parseInt(port, 10));
	}
	
	return listener;
};
