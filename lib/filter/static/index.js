'use strict';

var fs = require('fs'),
	path = require('path'),
	util = require('mini-util'),
	tpl = require('../../util/tpl');
	
var PATTERN_SLASH = /\\/g,

	TPL_LIST = fs.readFileSync(path.join(__dirname, 'list.tpl'), 'utf-8');

/**
 * Get the pathname of the requested file.
 * @param root {string}
 * @param pathname {string}
 * @return {string}
 */
function resolve(root, pathname) {
	pathname = path.normalize(pathname);
	pathname = path.join(root, pathname);
	
	return pathname;
}

/**
 * sort files and directories names separately.
 * @param dirname {string}
 * @param filenames {Array}
 * @param callback {Function}
 */
function sort(dirname, filenames, callback) {
	var files = [],
		directories = [];

	(function next(i) {
		if (i < filenames.length) {
			var filename = filenames[i];
			
			fs.stat(path.join(dirname, filename), function (err, stats) {
				if (err) { // Any file not found here will case a 404 response.
					callback(err);
				} else {
					if (stats.isFile()) {
						files.push(filename);
					} else if (stats.isDirectory()) {
						directories.push(filename + '/');
					} else {
						// Ignore other types.
					}
				}
				next(i + 1);
			});
		} else {
			callback(null, directories.sort().concat(files.sort()));
		}
	}(0));
}

/**
 * Filter factory.
 * @param [account] {Object}
 * @return {Function}
 */
module.exports = function (config) {
	config = config || {};
	
	if (util.isString(config)) {
		config = { root: config };
	}
	
	var root = config.root || './',
		indexes = config.indexes || true;
		
	if (util.isString(indexes)) {
		indexes = [ indexes ];
	}
	
	var customIndex = util.isArray(indexes);
	
	/**
	 * Find a possible index file among the given filenames.
	 * @param filenames {Array}
	 * @return {string|null}
	 */
	function findIndex(filenames) {
		var len = indexes.length,
			i = 0,
			index;

		for (; i < len; ++i) {
			index = indexes[i];
			if (filenames.indexOf(index) !== -1) {
				return index;
			}
		}

		return null;
	}
	
	function render(pathname, filenames) {
		var relative = path.relative(root, pathname)
				.replace(PATTERN_SLASH, '/');

		if (relative) {
			filenames.unshift('..');
		}
		
		return tpl(TPL_LIST, {
			filenames: filenames,
			relative: relative
		});
	}
		
	function readDir(pathname, callback) {
		fs.readdir(pathname, function (err, filenames) {
			var index;
		
			if (err) {
				callback(err);
			} else if (customIndex && (index = findIndex(filenames))) {
				pathname = path.join(pathname, index);
				readFile(pathname, callback);
			} else {
				sort(pathname, filenames, function (err, filenames) {
					if (err) {
						callback(err);
					} else {
						callback(null, render(pathname, filenames));
					}
				});
			}
		});
	}
		
	function readFile(pathname, callback) {
		fs.readFile(pathname, callback);
	}
		
	function read(pathname, callback) {
		fs.stat(pathname, function (err, stats) {
			if (err) {
				callback(err);
			} else if (stats.isDirectory() && indexes) {
				readDir(pathname, function (err, data) {
					callback(err, stats, data);
				});
			} else if (stats.isFile()) {
				readFile(pathname, function (err, data) {
					callback(err, stats, data);
				});
			} else {
				err = new Error();
				err.code = 'ENOENT';
				callback(err);
			}
		});
	}
	
	return function (req, res) {
		var pathname = resolve(root, req.pathname);
		
		read(pathname, function (err, stats, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					req(res.status(404));
				} else {
					res(err);
				}
			} else {
				res.status(200)
					.type(stats.isDirectory() ? 'html': path.extname(pathname))
					.head('last-modified', stats.mtime.toGMTString())
					.data(data)();
			}
		});
	};
};