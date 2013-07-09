var execFile = require('child_process').execFile,
	fs = require('fs'),
	path = require('path'),
	pegasus = require('pegasus'),
	util = require('pegasus').util;

	// Find NPM.
var npm = (function () {
		var dirnames = process.env['PATH'],
			separator = process.platform === 'win32' ?
				';' : ':',
			len, i, npm;

		dirnames = dirnames ? dirnames.split(separator) : [];

		for (i = 0, len = dirnames.length; i < len; ++i) {
			npm = path.join(dirnames[i],
				process.platform === 'win32' ? 'npm.cmd' : 'npm' );

			if (fs.existsSync(npm)) {
				break;
			}

			npm = null;
		}

		return npm && function (id, callback) {
			execFile(npm, [ 'install', id, '--prefix', '.' ], { cwd: process.cwd() }, callback);
		};
	}()),

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	pipe = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var self = this;

			this._config = config;
			this._module = null;
			this._moduleDirectory = path.join(process.cwd(), 'node_modules');

			if (this._exist()) {
				this._create();
			} else {
				this._dummify(util.format('Module "%s" is loading..', config.id));

				if (npm) {
					npm(config.id, function (err) {
						if (err) {
							self._dummify(util.format('Cannot load module "%s"', config.id));
						} else {
							self._create();
						}
					});
				} else {
					this._dummify(util.format('Cannot load module "%s"', config.id));
				}
			}
		},

		/**
		 * Create module instance.
		 */
		_create: function () {
			var config = this._config,
				dir = this._moduleDirectory;

			this._module = require(path.join(dir, config.id)).apply(null, config.params);
		},

		/**
		 * Create a dummy module.
		 * @params msg {string}
		 */
		_dummify: function (msg) {
			this._module = function (context, next) {
				util.throwError(msg);
			};
		},

		/**
		 * Check whether the module has been installed locally.
		 * @return {boolean}
		 */
		_exist: function () {
			var config = this._config,
				dir = this._moduleDirectory,
				result = false;

			try {
				require.resolve(path.join(dir, config.id));
				result = true;
			} catch (err) {
				// Not exists.
			}

			return result;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var context = this.context,
				next = this.next;

			this._module(context, next);
		}
	});

/**
 * Refine arguments.
 * @param id {string}
 * @return {Function}
 */
exports = module.exports = function (id) {
	return pipe({
		id: id,
		params: util.toArray(arguments).slice(1)
	});
};

// Exports native pipe modules.
util.mix(exports, {
	'cache': require('./pipe/cache'),
	'combo': require('./pipe/combo'),
	'compress': require('./pipe/compress'),
	'debug': require('./pipe/debug'),
	'dynamic': require('./pipe/dynamic'),
	'modular': require('./pipe/modular'),
	'pipe': require('./pipe/pipe'),
	'proxy': require('./pipe/proxy'),
	'redirect': require('./pipe/redirect'),
	'refine': require('./pipe/refine'),
	'static': require('./pipe/static')
});
