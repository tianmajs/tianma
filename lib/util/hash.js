'use strict';

var crypto = require('crypto');

/**
 * Calculate HASH value of input string.
 * @param str {string}
 * @param [algorithm] {string}
 * @return {string}
 */
module.exports = function (str, algorithm) {
	return crypto.createHash(algorithm || 'sha1')
		.update(str, 'binary')
		.digest('hex');
};
