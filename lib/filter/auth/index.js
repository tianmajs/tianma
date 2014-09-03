'use strict';

var hash = require('../../util/hash');

var PATTERN_WHITESPACE = /\s+/;

/**
 * Decode authorization string.
 * @param str {string}
 * @return {Array}
 */
function decode(str) {
	var parts = str.split(PATTERN_WHITESPACE),
		auth = [ '', '' ];
	
	if (parts[0] === 'Basic') {
		auth = new Buffer(parts[1] || '', 'base64').toString().split(':');
	}
	
	return auth;
}

/**
 * Whether the input matches the password.
 * @param pwd {string}
 * @param input {string}
 * @return {boolean}
 */
function verify(pwd, input) {
	if (pwd[0] === '#') {
		return pwd.substring(1) === hash(input, 'md5');
	} else {
		return pwd === input;
	}
}

/**
 * Filter factory.
 * @param [account] {Object}
 * @return {Function}
 */
module.exports = function (account) {
	account = account || {};
	
	return function (req, res) {
		var auth = decode(req.head('authorization')),
			username = auth[0],
			password = auth[1];
		
		// Authorize the user.
		if (username && verify(account[username], password)) {
			req(res);
		} else {
			res.status(401)
				.head('www-authenticate', 'Basic realm=""')();
		}
	};
};
