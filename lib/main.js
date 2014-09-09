'use strict';

var util = require('mini-util'),
	listener = require('./listener'),
	play = require('./play'),
	server = require('./server');

/**
 * HTTP server factory.
 * @param config {number|string|Object}
 * @return {Function}
 */
exports = module.exports = function (config) {
	/* Remote config mode. */
	
	if (util.isString(config)) {
		return play.apply(null, arguments);
	}

	/* Do some preparations. */

	// Fast config.
	if (util.isUndefined(config)) {
		config = {
			port: 80
		};
	} else if (util.isNumber(config)) {
		config = {
			port: config
		};
	}

	// Mix with defualt config.
	config = util.mix({
		charset: 'utf-8',
		ip: '0.0.0.0',
		port: null,
		portssl: null
	}, config);
	
	
	/* Let's go! */
	
	var l = listener.create(config.charset);

	server.create(config, l);

	return l;
};

