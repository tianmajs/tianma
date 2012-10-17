/**
 * Tianma - App
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	path = require('path'),
	util = require('util');

var EOL = {
		'darwin': '\r',
		'linux': '\n',
		'win32': '\r\n'
	},

	/**
	 * Initiate application.
	 */
	init = function (config) {
		hookOutput(config.silent, config.log ? openLog() : null);

		exports.configured = true;
	},

	/**
	 * Hook console.log and console.error.
	 * @param silent {boolean}
	 * @param log {Object|null}
	 */
	hookOutput = function (silent, ws) {
		var log = console.log.bind(console),
			err = console.error.bind(console),
			eol = EOL[process.platform] || '\n',
			dup = function (message) {
				ws && ws.write(util.format('[%s] %s%s',
					new Date().toLocaleTimeString(), message, eol));
			};

		console.log = function () {
			var message = util.format.apply(util, arguments);

			silent || log(message);
			dup(message);
		};

		console.error = function () {
			var message = util.format.apply(util, arguments);

			silent || err(message);
			dup(message);
		};
	},

	/**
	 * Open log file write stream.
	 */
	openLog = function () {
		var now = new Date(),
			filename = util.format('%s-%s-%s.log',
				now.getFullYear(),
				now.getMonth() + 1,
				now.getDate()
			),
			dir = path.join(process.cwd(), '.log'),
			pathname = path.join(dir, filename);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		return fs.createWriteStream(pathname, { flags: 'a' });
	};

exports.configured = false;
exports.init = init;