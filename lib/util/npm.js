'use strict';

var fs = require('fs'),
	path = require('path'),
	semver = require('semver'),
	util = require('mini-util');

var PATTERN_ID = /^(http:\/\/.*?\/)?(.*)$/;

var npm,

	options = {
		loglevel: 'silent',
		tmp: './tmp',
		prefix: process.env['TIANMA_PATH'] || './'
	},
	
	queue = [],
	
	running = false;

/**
 * Initialzer.
 */
function initiate() {
	var dirnames, i, len;

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
		if (process.platform === 'win32') {
			options.cache = path.join(
				process.env['APPDATA'] || '.', 'npm-cache');
		} else {
			options.cache = path.join(
				process.env['HOME'] || '.', '.npm');
		}
	} else {
		throw new Error('NPM not found');
	}
}

/**
 * Load a local module.
 * @param id {string}
 * @return {Object|null}
 */
function load(id) {
	var parts = id.split('@'),
		name = parts[0],
		version = parts[1] || '',
		pkg = path.join(options.prefix, 'node_modules', name)
		exports = null;

	try {
		exports = require(pkg);
		if (version) {
			pkg = require(path.join(pkg, 'package.json'));
			exports = semver.satisfies(pkg.version, version) ? exports : null;
		}
	} catch (err) {
		// Not exists.
		exports = null;
	}

	return exports;
}

/**
 * Install a module.
 * @param id {string}
 * @param registry {string|null}
 * @param callback {Function}
 */
function install(id, registry, callback) {
	queue.push({
		id: id,
		callback: callback
	});
	
	if (!running) {
		running = true;
		(function next() {
			if (queue.length > 0) {
				var task = queue.shift(),
					opt = util.merge(options);
					
				if (registry) {
					opt.registry = registry;
				}

				npm.load(opt, function (err, npm) {
					if (err) {
						task.callback(err);
					} else {
						console.log('Install remote module "%s"..', task.id);
						npm.commands.install([ task.id ], function (err) {
							task.callback(err);
							next();
						});
					}
				});
			} else {
				running = false;
			}
		}());
	}
}

exports.load = function (url, callback) {
	// Initiate at the first time call.
	initiate();
	// Change to a normal loader.
	exports.load = function (url, callback) {
		var re = url.match(PATTERN_ID),
			registry = re[1] || null,
			id = re[2],
			exports;

		// Try to load.
		exports = load(id);
	
		if (!exports) { // Not found.
			// Install by NPM.
			install(id, registry, function (err) {
				if (err) {
					callback(err);
				} else {
					if (exports = load(id)) { // Assign.
						callback(null, exports);
					} else {
						callback(new Error());
					}
				}
			});
		} else { // Exists.
			callback(null, exports);
		}
	};
	// Call the normal loader.
	exports.load(url, callback);
};

