'use strict';

var fs = require('fs'),
	gw = require('gw'),
	milu = require('milu'),
	mu = require('mini-util');
	
// Generate the MAGIC chaining method.
var PROTO = (function () {
	var proto = function () {};
	
	module.paths.forEach(function (p) {
		if (fs.existsSync(p)) {
			fs.readdirSync(p).forEach(function (name) {
				if (name.indexOf('tianma-') === 0) {
					proto[name.replace('tianma-', '')] = function () {
						return this.pipe(require(name).apply(null, arguments));
					};
				}
			});
		}
	});
	
	return proto;
}());

/**
 * Reset the response before/after a filer.
 * @param fn {Function}
 * @return {Function}
 */
function reset(fn) {
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
function wrap(listener, filter) {
	filter = filter || milu();

	function wrapper(request, response) {
		listener(request, response, filter);
	}
	
	wrapper.__proto__ = PROTO;
	
	wrapper.pipe = function (fn) {
		if (mu.isGenerator(fn)) {
			fn = gw(fn);
		}
	
		return wrap(listener, filter.pipe(reset(fn)));
	};
	
	return wrapper;
}

module.exports = wrap;