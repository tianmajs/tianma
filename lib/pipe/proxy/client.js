/**
 * Tianma - Pipe - Proxy - Client
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var http = require('http'),
	https = require('https'),
	url = require('url'),
	util = require('pegasus').util,
	zlib = require('zlib');

var PATTERN_IP = /^(?:\d+\.){3}\d+$/,

	/**
	 * Decompress gzip or deflate data.
	 * @param data {Buffer}
	 * @param encoding {string}
	 * @param callback {Function}
	 */
	decompress = function (data, encoding, callback) {
		if (encoding === 'gzip') {
			zlib.gunzip(data, callback);
		} else if (encoding === 'deflate') {
			zlib.inflate(data, callback);
		} else {
			callback(null, data);
		}
	},

	/**
	 * Send request to remote server.
	 * @param options {Object}
	 * @param callback {Function}
	 */
	send = function (options, callback) {
		var meta = url.parse(options.href),
			client = meta.protocol === 'https:' ? https : http,
			request;

		options.hostname = meta.hostname;
		options.path = meta.path;

		if (meta.auth) {
			// Hostname in config has the highest priority.
			options.headers.host = meta.auth;
		} else if (!PATTERN_IP.test(options.hostname)) {
			// If remote hostname is not ip, change headers.host to the same.
			options.headers.host = options.hostname;
		}

		if (meta.port) { // Override default port.
			options.port = meta.port;
		}

		request = client.request(options, function (response) {
			var status, head,
				body = [];

			response.on('data', function (chunk) {
				body.push(chunk);
			});

			response.on('end', function () {
				status = response.statusCode;
				head = response.headers;
				body = Buffer.concat(body);

				// Use chunked transfer-encoding.
				if (head['content-length']) {
					delete head['content-length'];
				}

				// Decompress body for reading.
				decompress(body, head['content-encoding'], function (err, body) {
					if (err) {
						callback(err);
					} else {
						delete head['content-encoding'];
						callback(null, {
							status: status,
							head: head,
							body: body
						});
					}
				});
			});
		});

		request.on('error', callback);
		request.write(options.body);
		request.end();
	};

exports.send = send;
