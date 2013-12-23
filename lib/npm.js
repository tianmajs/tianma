var fs = require('fs'),
	path = require('path'),
	util = require('pegasus').util;

var runner = null,

	/**
	 * Module initializer.
	 */
	initialize = function () {
		var npm, dirnames, i, len, options;

		try {
			npm = require('npm');
		} catch (err) {}

		if (!npm && process.platform === 'win32') {
			dirnames = process.env['PATH'];
			dirnames = dirnames ? dirnames.split(';') : [];

			for (i = 0, len = dirnames.length; i < len; ++i) {
				if (fs.existsSync(path.join(dirnames[i], 'npm.cmd'))) {
					try {
						npm = require(path.join(dirnames[i],
							'node_modules/npm'));
						break;
					} catch (err) {}
				}
			}
		}

		if (npm) {
			options = {
				loglevel: 'silent',
				tmp: './tmp'
			};

			if (process.platform === 'win32') {
				options.cache = path.join(
					process.env['APPDATA'] || '.', 'npm-cache');
			} else {
				options.cache = path.join(
					process.env['HOME'] || '.', '.npm');
			}

			runner = function (id, callback) {
				npm.load(options, function (err, npm) {
					if (err) {
						callback(err);
					} else {
						npm.commands.install([ id ], callback);
					}
				});
			};
		} else {
			runner = function (id, callback) {
				callback(new Error(
					util.format(
						'NPM not found, please install %s manually.',
						id)));
			};
		}
	};

module.exports = function () {
	if (!runner) {
		initialize();
	}
	runner.apply(this, arguments);
};
