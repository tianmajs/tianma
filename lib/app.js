/**
 * Tianma - App
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	path = require('path'),
	util = require('./util');

var eol = ({
		'darwin': '\r',
		'linux': '\n',
		'win32': '\r\n'
	})[process.platform] || '\n',

	app = {
		/**
		 * Close log write stream.
		 * @param callback {Function}
		 */
		_closeLog: function (callback) {
			var logStream = this._logStream;

			if (logStream) {
				logStream.on('close', callback);
				logStream.end();
			} else {
				callback();
			}
		},

		/**
		 * Hook console.log and console.error.
		 */
		_hookOutput: function () {
			var config = this._config,
				log = console.log.bind(console),
				error = console.error.bind(console),
				writeLog = this._writeLog.bind(this);

			console.log = function () {
				var message = util.format.apply(util, arguments);

				config.silent || log(message);
				config.log && writeLog(message);
			};

			console.error = function () {
				var message = util.format.apply(util, arguments);

				config.silent || error(message);
				config.log && writeLog(message);
			};
		},

		/**
		 * Open log file write stream.
		 */
		_openLog: function () {
			var now = new Date(),
				dirname = path.join(process.cwd(), '.log'),
				filename = path.join(dirname, util.format('%s-%s-%s.log',
					now.getFullYear(),
					now.getMonth() + 1,
					now.getDate()
				));

			if (!fs.existsSync(dirname)) {
				fs.mkdirSync(dirname);
			}

			this._logStream = fs.createWriteStream(filename, { flags: 'a' });
		},

		/**
		 * Write message to log file.
		 * @param message {string}
		 */
		_writeLog: function (message) {
			var logStream = this._logStream;

			logStream.write(util.format('[%s] %s%s',
				new Date().toLocaleTimeString(), message, eol));
		},

		/**
		 * Exit application.
		 * @param [err] {Error}
		 */
		exit: function (err) {
			if (err) {
				util.error(err);
			}

			this._closeLog(function () {
				process.exit(err ? -1 : 0);
			});
		},

		/**
		 * Initiate application.
		 * @param config {Object}
		 */
		init: function (config) {
			this._config = config;

			if (config.log) {
				this._openLog();
			}

			if (config.log || config.silent) {
				this._hookOutput();
			}
		}
	};

module.exports = app;
