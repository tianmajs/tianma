/**
 * Tianma - Pipe - Static
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	path = require('path'),
	tianma = require('tianma'),
	util = tianma.util;

var PATTERN_PATHNAME_END = /\/?$/,

	LIST_TEMPLATE = fs.readFileSync(path.join(__dirname, 'list.tmpl'), 'utf-8'),

	/**
	 * Get filename of requested file.
	 * @param pathname {string}
	 * @param pathroot {string}
	 * @param wwwroot {string}
	 * @return {string}
	 */
	getFilename = function (pathname, pathroot, wwwroot) {
		var filename;

		// Relocate pathname based on mount point.
		pathname = pathname.substring(pathroot.length + 1);

		// Resolve relative pathname such as "../".
		filename = path.resolve(path.join(wwwroot, pathname));

		// Ensure filename under root.
		return filename < wwwroot ? wwwroot : filename;
	},

	/**
	 * Find index file in folder.
	 * @param files {Array}
	 * @param indexes {Array}
	 * @return {string|null}
	 */
	getIndexFile = function (files, indexes) {
		var len = indexes.length,
			i = 0,
			indexFile;

		for (; i < len; ++i) {
			indexFile = indexes[i];
			if (files.indexOf(indexFile) !== -1) {
				return indexFile;
			}
		}

		return null;
	},


	/**
	 * sort files and dirs separately.
	 * @param dirname {string}
	 * @param items {Array}
	 * @param callback {Function}
	 */
	sort = function (dirname, items, callback) {
		var files = [],
			dirs = [];

		(function next(i) {
			var item;

			if (i < items.length) {
				item = items[i];
				fs.stat(path.join(dirname, item), function (err, stats) {
					if (err) {
						util.error(err);
					} else {
						if (stats.isFile()) {
							files.push(item);
						} else if (stats.isDirectory()) {
							dirs.push(item + '/');
						}
					}
					next(i + 1);
				});
			} else {
				callback(dirs.sort().concat(files.sort()));
			}
		}(0));
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	static = tianma.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = util.mix({
				indexes: [],
				root: './'
			}, config);
		},

		/**
		 * Finish procesing request.
		 * @params status {number}
		 * @params data {string}
		 * @params [contextType] {string}
		 */
		done: function (status, data, contextType) {
			var context = this.context;

			context.response
				.status(status)
				.head('content-type', contextType || 'text/plain')
				.clear()
				.write(data);

			this.next();
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			return response.status() === 404;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				context = this.context,
				filename = getFilename(request.pathname, context.root, config.root);

			fs.stat(filename, function (err, stats) {
				if (err) { // Unexist file raises 404.
					this.done(404, '404 Not Found');
				} else {
					if (stats.isFile()) {
						this.readFile(filename);
					} else if (stats.isDirectory()) {
						this.readDir(filename);
					} else { // Other file types also raise 404.
						this.done(404, '404 Not Found');
					}
				}
			}.bind(this));
		},

		/**
		 * Read directory and response with directory contents list.
		 * @param dirname {string}
		 */
		readDir: function (dirname) {
			var config = this._config,
				context = this.context;

			fs.readdir(dirname, function (err, items) {
				var indexFile;

				if (err) {
					this.panic(err);
				} else {
					indexFile = getIndexFile(config.indexes, items);
					if (indexFile) {
						this.readFile(path.join(dirname, indexFile));
					} else {
						sort(dirname, items, function (items) {
							// Pathname of directory should end with "/".
							var pathname = context.request.pathname
								.replace(PATTERN_PATHNAME_END, '/');

							items = (pathname > '/' ? [ '.', '..' ].concat(items) : items).map(function (item) {
								return {
									name: item,
									href: encodeURI(pathname + item)
								};
							});

							this.done(200, util.tmpl(LIST_TEMPLATE, {
								charset: context.charset,
								items: items,
								pathname: pathname
							}), 'text/html');
						}.bind(this));
					}
				}
			}.bind(this));
		},

		/**
		 * Read file and response with file content.
		 * @param filename {string}
		 */
		readFile: function (filename) {
			var context = this.context;

			fs.readFile(filename, function (err, data) {
				if (err) {
					this.panic(err);
				} else {
					this.done(200, data, util.mime(filename));
				}
			}.bind(this));
		}
	});

module.exports = static;