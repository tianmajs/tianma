var pipe = require('./pipe'),
	pegasus = require('pegasus'),
	player = require('./player'),
	version = require('./version'),
	Host = require('./host');

// Enlarge max concurrent sockets number per host.
require('http').globalAgent.maxSockets = 1024;
require('https').globalAgent.maxSockets = 1024;

/**
 * Factory.
 * @param config {Object}
 * @return {Object}
 */
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
exports.play = player.play;

// Export version number.
exports.version = version.number;
