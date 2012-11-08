/**
 * Tianma - Main
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var App = require('./app'),
	ca = require('./ca'),
	fs = require('fs'),
	pegasus = require('pegasus'),
	util = pegasus.util,
	version = require('./version');

var	instance = null,

	// Tianma constructor.
	Tianma = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			new App(config);
		},

		/**
		 * Create an Host instance.
		 * @param config {Object}
		 * @return {Object}
		 */
		createHost: function (config) {
			var cert, key;

			if (config.portssl) {
				cert = config.cert || './certificates/tianma.cer';
				key = config.key || './certificates/tianma.key';

				try {
					config.cert = fs.readFileSync(cert);
					config.key = fs.readFileSync(key);
					config.secureContext = ca.load();
				} catch (err) {
					// Fatal error.
					throw util.error(err);
				}
			}

			return pegasus.createHost(config);
		}
	});

/**
 * Factory.
 * @param config {Object}
 * @return {Object}
 */
exports = module.exports = function (config) {
	if (!instance) {
		instance = new Tianma(config);
	}

	return instance;
};

// Export version number.
exports.version = version.number;

// Export build-in pipe functions.
exports.pipe = {
	'beautify': require('./pipe/refine').beautify,
	'combo': require('./pipe/combo'),
	'compress': require('./pipe/compress'),
	'dynamic': require('./pipe/dynamic'),
	'minify': require('./pipe/refine').minify,
	'proxy': require('./pipe/proxy'),
	'refine': require('./pipe/refine').custom,
	'static': require('./pipe/static')
};
