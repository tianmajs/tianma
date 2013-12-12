var ca = require('./ca'),
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	path = require('path'),
	util = require('pegasus').util;

var DEFAULT_CERT = path.join(__dirname, '../deploy/certificates/tianma.cer'),

	DEFAULT_KEY = path.join(__dirname, '../deploy/certificates/tianma.key'),

	// Http constructor.
	Http = exports.Http = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._server = http.createServer(config.listener);

			this._server.on('error', function (err) {
				switch (err.code) {
				case 'EADDRINUSE':
					console.log(
						'[!] Port %s is used by another program.\n' +
						'    Try to find and close it first.', config.port);
					break;
				case 'EACCES':
					console.log(
						'[!] Cannot use port %s without running as root.\n' +
						'    Try to run command with `sudo`.', config.port);
					break;
				default:
				}
				throw err;
			});
		},

		/**
		 * Start service.
		 * @param callback {Function}
		 */
		start: function (callback) {
			var config = this._config,
				server = this._server;

			server.listen(config.port, config.ip, callback);
		},

		/**
		 * Stop service.
		 * @param callback {Function}
		 */
		stop: function (callback) {
			var server = this._server;

			server.close(callback);
		}
	}),

	// Https constructor.
	Https = exports.Https = Http.extend({
		/**
		 * Initializer.
		 * @param config {Object}
		 * @override
		 */
		_initialize: function (config) {
			this._config = config;

			var server = this._server = https.createServer({
					cert: fs.readFileSync(config.cert || DEFAULT_CERT),
					key: fs.readFileSync(config.key || DEFAULT_KEY),
				}, config.listener);

			util.each(ca(), function (value, key) {
				server.addContext(key, value);
			});
		}
	});