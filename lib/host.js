var domain = require('domain'),
	pegasus = require('pegasus'),
	server = require('./server'),
	util = pegasus.util;

	// Host constructor.
var	Host = util.inherit(Object, {
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

			var listener = this._createListener(),

				servers = this._servers = [];

			if (util.isNumber(config.port)) {
				servers.push(new server.Http({
					ip: config.ip || '0.0.0.0',
					port: config.port,
					listener: listener
				}));
			}

			if (util.isNumber(config.portssl)) {
				servers.push(new server.Https({
					ip: config.ip || '0.0.0.0',
					port: config.portssl,
					listener: listener,
					cert: config.cert,
					key: config.key
				}));
			}
		},

		/**
		 * Create a HTTP listener.
		 * @return {Function}
		 */
		_createListener: function () {
			var router = this._router;

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
						while (request.loop) {
							request = request.loop;
						}

						err.stack = util.format('%s\n    at %s//%s%s',
							err.stack
								|| ('Error: ' + (err.message || err)),
							request.protocol
								|| (request.connection.encrypted ? 'https:' : 'http:'),
							request.headers.host, request.url);

						response.writeHead(500, {
							'content-type': 'text/plain',
							'server': 'pegasus/' + pegasus.version
						});

						response.end('[!] Internal Server Error'
							+ '\n'
							+ '---------------------------'
							+ '\n'
							+ err.stack
						);

						if (util.isCheckedError(err)) {
							util.error(err.stack);
						} else {
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
			var servers = this._servers,
				self = this;

			(function next(i) {
				if (i < servers.length) {
					servers[i].start(function () {
						next(i + 1);
					});
				} else {
					callback && callback(self);
				}
			}(0));

			return this;
		},

		/**
		 * Stop service.
		 * @param callback {Function}
		 * @return {Object}
		 */
		stop: function (callback) {
			var servers = this._servers,
				self = this;

			(function next(i) {
				if (i < servers.length) {
					servers[i].stop(function () {
						next(i + 1);
					});
				} else {
					callback && callback(self);
				}
			}(0));

			return this;
		}
	});

module.exports = Host;
