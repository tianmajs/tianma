var ca = require('./ca'),
	domain = require('domain'),
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	pegasus = require('pegasus'),
	util = pegasus.util;

var DEFAULT_CERT = './certificates/tianma.cer',

	DEFAULT_KEY = './certificates/tianma.key',

	// Host constructor.
	Host = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			config = this._config = util.mix({
				cert: null,
				charset: 'utf-8',
				ip: null,
				key: null,
				port: null,
				portssl: null
			}, config);

			this._router = pegasus.createRouter({
				charset: config.charset
			});

			this._createServer();
		},

		/**
		 * Create a HTTP listener.
		 * @return {Function}
		 */
		_createListener: function () {
			var config = this._config,
				router = this._router;

			return function (request, response) {
				var data = [],
					len = 0;

				request.on('data', function (chunk) {
					data.push(chunk);
					len += chunk.length;
				});

				request.on('end', function () {
					var body = Buffer.concat(data, len),
						sandbox = domain.create();

					sandbox.on('error', function (err) {
						var detail = (err.stack
								|| 'Error: ' + (err.message || err)),
							req = request,
							fatal = !util.isCheckedError(err);

						while (req.loop) {
							req = req.loop;
						}

						detail += util.format('\n    at %s//%s%s',
							req.protocol
								|| (req.connection.encrypted ? 'https:' : 'http:'),
							req.headers.host, req.url);

						response.writeHead(500, {
							'content-type': 'text/plain',
							'server': 'pegasus/' + pegasus.version
						});

						response.end('[!] Internal Server Error'
							+ '\n'
							+ '---------------------------'
							+ '\n'
							+ detail
						);

						util.error(detail);

						if (fatal) {
							throw err;
						}
					});

					sandbox.run(function () {
						request.body = body
						router.route(request, response);
					});
				});
			};
		},

		/**
		 * Create servers.
		 */
		_createServer: function () {
			var config = this._config,
				listener = this._createListener();

			if (util.isNumber(config.port)) {
				this._httpServer = http.createServer(listener);
			}

			if (util.isNumber(config.portssl)) {
				this._httpsServer = https.createServer({
					cert: fs.readFileSync(config.cert || DEFAULT_CERT),
					key: fs.readFileSync(config.key || DEFAULT_KEY),
				}, listener);

				util.each(ca.load(), function (value, key) {
					this._httpsServer.addContext(key, value);
				}, this);
			}
		},

		/**
		 * Add a new mount point.
		 * @param point {Object}
		 * @param [options] {Object}
		 * @param pipe {Array}
		 * @return {Object}
		 */
		mount: function () {
			var router = this._router;

			router.mount.apply(router, arguments);

			return this;
		},

		/**
		 * Start service.
		 * @param callback {Function}
		 * @return {Object}
		 */
		start: function (callback) {
			var http = this._httpServer,
				https = this._httpsServer,
				config = this._config,
				onStart = (callback || function () {}).bind(this);

			http && http.listen(config.port, config.ip || undefined, onStart);
			https && https.listen(config.portssl, config.ip || undefined, onStart);

			return this;
		},

		/**
		 * Stop service.
		 * @param callback {Function}
		 * @return {Object}
		 */
		stop: function (callback) {
			var http = this._httpServer,
				https = this._httpsServer,
				onStop = (callback || function () {}).bind(this);

			http && http.close(onStop);
			https && https.close(onStop);

			return this;
		}
	});

module.exports = Host;
