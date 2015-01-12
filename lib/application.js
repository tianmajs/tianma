'use strict';

var filter = require('./filter'),
	http = require('http'),
	https = require('easy-https'),
	listener = require('./listener'),
	mu = require('mini-util');

/**
 * Create the root Handler.
 * @param [options] {Object}
 * @return {Object}
 */
module.exports = function (options) {
	options = mu.mix({
		ip: '0.0.0.0',
		port: null,
		portssl: null
	}, options);

	var	fn = filter(listener);
	
	if (options.port) {
		http.createServer(fn)
			.listen(options.port, options.ip);
	}
	
	if (options.portssl) {	
		https.createServer(fn)
			.listen(options.portssl, options.ip);
	}
	
	return fn;
};
