var cp = require('child_process'),
	fs = require('fs'),
	npm = require('./npm'),
	path = require('path'),
	pegasus = require('pegasus'),
	util = require('pegasus').util;

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	pipe = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var self = this;

			this._config = config;
			this._module = function (context, next) {
				util.throwError(
					util.format('Module "%s" is loading..', config.id));
			};
			this._moduleDirectory = path.join(process.cwd(), 'node_modules');

			if (this._exist()) {
				this._create();
			} else {
				console.log('[i] Try to download module "%s" with NPM..\n', config.id);

				if (!fs.existsSync(this._moduleDirectory)) {
					// Create node_modules folder first to ensure install here.
					fs.mkdirSync(this._moduleDirectory);
				}

				npm(config.id, function (err) {
					if (err) {
						console.log(err.message);
						console.log('\n[!] ..error occurred');
						throw err;
					} else {
						console.log('\n[i] ..done');
						self._create();
					}
				});
			}
		},

		/**
		 * Create module instance.
		 */
		_create: function () {
			var config = this._config,
				dir = this._moduleDirectory;

			this._module = require(path.join(dir, config.id.split('@')[0]))
				.apply(null, config.params);
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
				parts = config.id.split('@'),
				name = parts[0],
				version = parts[1],
				result = false;

			try {
				require.resolve(path.join(dir, name));
				result = true;
				if (version) {
					result = (require(path.join(dir, name, 'package.json'))
						.version === version);
				}
			} catch (err) {
				// Not exists.
				result = false;
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
