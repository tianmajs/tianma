'use strict';

var exec = require('child_process').exec,
	findit = require('findit'),
	fs = require('fs'),
	path = require('path'),
	util = require('mini-util');

var PATTERN_REPLACEMENT = /\$(\d+)/g,
	
	HOT_PERIOD = 3000;

/**
 * Generate a stamp of the input directory by mtime.
 * @param dirname {string}
 * @parma callback {Function}
 */
function stamp(dirname, callback) {
	var finder = findit(dirname),
		mtime = 0;

	// In case of file modification/creation.
	finder.on('file', function (file, stat) {
		mtime = Math.max(stat.mtime, mtime);
	});
	
	// In case of file creation/deletion.
	finder.on('directory', function (file, stat) {
		mtime = Math.max(stat.mtime, mtime);
	});
	
	finder.on('end', function () {
		callback(mtime);
	});
}

/**
 * Module factory.
 * @param config {string|Object}
 * @return {Function}
 */
module.exports = function (config) {
	if (!util.isObject(config)) {
		config = {
			action: config
		};
	}
	
	var action = config.action || '',
		target = config.target || './',
		pattern = config.pattern || /./,
		record = {};

	/**
	 * Match the pathname with the pattern.
	 * @param pathname {string}
	 * @return {string|null}
	 */
	function match(pathname) {
		var re, dirname;
		
		if (re = pathname.match(pattern)) { // Assign.
			dirname = target.replace(PATTERN_REPLACEMENT, function (all, i) {
				return re[i];
			});
			dirname = path.resolve(dirname);
		}
		
		return dirname || null;
	}
	
	/**
	 * Register a watching target.
	 * @param dirname {string}
	 * @param callback {Function}
	 */
	function register(dirname, callback) {
		fs.exists(dirname || '', function (exists) {
			if (exists) {
				callback(record[dirname] = record[dirname] || {
					error: null,
					idle: true,
					atime: 0,
					mtime: 0,
					path: dirname,
					pending: []
				});
			} else {
				callback(record[dirname] = null);
			}
		});
	}
	
	/**
	 * Compile a directory.
	 * @param dirname {Object}
	 * @param callback {Function}
	 */
	function compile(dir, callback) {
		stamp(dir.path, function (mtime) {
			if (!dir.error && mtime <= dir.mtime) {
				// No change in directory.
				dir.mtime = Date.now();
				callback();
			} else if (util.isFunction(action)) {
				// Refresh by function.
				action(dir.path, function (err) {
					dir.mtime = Date.now();
					dir.error = err;
					callback();
				});
			} else {
				// Refresh by command.
				exec(action, { cwd: dir.path }, function (err) {
					dir.mtime = Date.now();
					dir.error = err;
					callback();
				});
			}
		});
	}
	
	/**
	 * Refresh a directory.
	 * @param dir {Object}
	 * @param callback {Function}
	 */
	function refresh(dir, callback) {
		var previous = Math.max(dir.atime, dir.mtime),
			now = Date.now();
			
		dir.atime = now;
		
		if (!dir.idle) { // Directory is refreshing.
			return dir.pending.push(callback);
		}
		
		if (now - previous < HOT_PERIOD) { // Directory is still host.
			return callback(dir.error);
		}
		
		dir.pending.push(callback);
		dir.idle = false;
		
		compile(dir, function () {
			dir.idle = true;
			while (dir.pending.length > 0) {
				dir.pending.pop()(dir.error);
			}
		});
	}

	/**
	 * @param req {Function}
	 * @param res {Function}
	 */
	return function (req, res) {
		var dirname = match(req.pathname),
			force = req.head('cache-control') === 'no-cache';

		register(dirname, function (dir) {
			if (!dir) { // Directory not found on the Earth.
				req(res);
			} else if (!force && dir.mtime > 0) {// Use previous result.
				dir.error ? res(dir.error) : req(res);
			} else { // Refresh direcory.
				refresh(dir, function (err) {
					err ? res(err) : req(res);
				});
			}
		});
	};
};