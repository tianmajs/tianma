/**
 * Tianma - Pipe - Proxy - Transfer
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var http = require('http'),
	https = require('https'),
	url = require('url'),
	util = require('tianma').util,
	zlib = require('zlib');

var PATTERN_IP = /^(?:\d+\.){3}\d+$/,

	/**
	 * Client response handler.
	 * @param callback {Function}
	 * @param clientResponse {Object}
	 */
	onResponse = function (callback, clientResponse) {
		var body = [],
			result = {};

		clientResponse.on('data', function (chunk) {
			body.push(chunk);
		});

		clientResponse.on('end', function () {
			result.status = clientResponse.statusCode;
			result.headers = clientResponse.headers;
			result.body = Buffer.concat(body);

			// content-length field is useless
			// because transfer-encoding of pipeline response is chunked.
			if (result.headers['content-length']) {
				delete result.headers['content-length'];
			}

			// Unzip body for other pipes to read or modify body.
			unzip(result, function (err, data) {
				if (err) {
					callback(err);
				} else {
					result.body = data;
					delete result.headers['content-encoding'];
					callback(null, result);
				}
			});
		});
	},

	/**
	 * Transfer request to remote server.
	 * @param request {Object}
	 * @param href {string}
	 * @param callback {Function}
	 */
	transfer = function (request, href, callback) {
		var meta = url.parse(href),
			client = meta.protocol === 'https:' ? https : http,
			clientRequest,
			options = {
				hostname: meta.hostname,
				path: meta.path,
				method: request.method,
				headers: util.merge(request.head()) // Avoid modifying the original.
			};

		if (meta.port) {
			// Override default port.
			options.port = meta.port;
		}

		if (!PATTERN_IP.test(options.hostname)) {
			// If remote hostname is not ip, change headers.host to the same.
			options.headers.host = options.hostname;
		}

		clientRequest = client.request(options, onResponse.bind(null, callback));

		clientRequest.on('error', callback);
		clientRequest.write(request.body());
		clientRequest.end();
	},

	/**
	 * Unzip gzipped or deflated response body.
	 * @param result {Object}
	 * @param callback {Function}
	 */
	unzip = function (result, callback) {
		var encoding = result.headers['content-encoding'],
			data = result.body;

		if (encoding === 'gzip') {
			zlib.gunzip(data, callback);
		} else if (encoding === 'deflate') {
			zlib.inflate(data, callback);
		} else {
			callback(null, data);
		}
	};

module.exports = transfer;