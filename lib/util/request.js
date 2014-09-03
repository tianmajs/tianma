'use strict';

var server = {
		'http:': require('http'),
		'https:': require('https')
	},
	url = require('url'),
	util = require('mini-util'),
	zlib = require('zlib');
	
var PATTERN_IP = /^(?:\d+\.){3}\d+$/,

	AGENT = {};
	
/**
 * Decompress gzip or deflate data.
 * @param data {Buffer}
 * @param encoding {string}
 * @param callback {Function}
 */
function decompress(data, encoding, callback) {
	if (encoding === 'gzip') {
		zlib.gunzip(data, callback);
	} else if (encoding === 'deflate') {
		zlib.inflate(data, callback);
	} else {
		callback(null, null);
	}
}

/**
 * HTTP request handler.
 * @param request {Function}
 * @param response {Object}
 * @param callback {Function}
 */
function request(options, callback) {
	var meta = url.parse(options.href);
	
	// If remote hostname is not ip, change headers.host to the same.
	if (!PATTERN_IP.test(meta.hostname)) {
		options.headers.host = meta.hostname;
	}
	
	if (meta.auth) {
		options.headers.host = meta.auth
			+ (meta.port ? ':' + meta.port : '');
	}
	
	options.agent = AGENT[meta.protocol];
	options.headers['accept-encoding'] = 'gzip, deflate';
	options.hostname = meta.hostname;
	options.path = meta.path;
	options.port = meta.port;

	var req = server[meta.protocol].request(options, function (res) {
		var statusCode = res.statusCode,
			headers = res.headers,
			encoding = headers['content-encoding'],
			body = [];

		res.on('data', function (chunk) {
			body.push(chunk);
		});

		res.on('end', function () {
			body = Buffer.concat(body);

			decompress(body, encoding, function (err, data) {
				if (err) {
					callback(err);
				} else {
					if (encoding && data) {
						// No more encoding for the content.
						delete headers['content-encoding'];
					}

					// Data may be untouched.
					data = data || body;

					// Length is unsuitable for changeable content.
					delete headers['content-length'];
					

					callback(null, {
						statusCode: statusCode,
						headers: headers,
						body: data
					});
				}
			});
		});
	});

	req.on('error', callback);

	req.end(options.body);
}

[ 'http:', 'https:' ].forEach(function (protocol) {
	AGENT[protocol] = new server[protocol].Agent();
	AGENT[protocol].maxSockets = 1024;
});

module.exports = function (options, callback) {
	if (util.isString(options)) {
		options = {
			href: options
		};
	}
	
	options = util.mix({
		method: 'GET',
		href: null,
		headers: {},
		body: null
	}, options);
	
	request(options, callback);
};
