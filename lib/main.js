var pipe = require('./pipe'),
	play = require('./play'),
	version = require('./version'),
	util = require('pegasus').util,
	Host = require('./host');

exports = module.exports = function () {
	return exports;
};

/**
 * Create an Host instance.
 * @param config {Object}
 * @return {Object}
 */
exports.createHost = function (config) {
	return new Host(config);
};

// Export build-in pipe functions.
exports.pipe = pipe;

// Export player.
exports.play = play;

// Export version number.
exports.version = version.number;
