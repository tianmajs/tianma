/**
 * Tianma - Pipe - Modular - Preprocessor
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var events = require('events'),
	path = require('path'),
	url = require('url'),
	util = require('pegasus').util;

var PATTERN_INLINE = /([^\.])require\s*\(\s*['"](.*?\.(?:json|tpl))['"]\s*\)/g,

	PATTERN_SINGLE_ID = /([^\.])(require|seajs\.use|require.async)\s*\(\s*['"](.*?)['"]/g,

	PATTERN_MULTIPLE_ID = /([^\.])(seajs\.use|require\.async)\s*\(\s*\[(.*?)\]/g,

	PATTERN_SPECIAL_CHAR = /["\\\r\n\t\f]/g,

	ESCAPE = {
		'"': '\\"',
		'\r': '\\r',
		'\n': '\\n',
		'\t': '\\t',
		'\f': '\\f'
	},

	parser = {
		/**
		 * Validate JSON data.
		 * @param data {string}
		 * @return {string}
		 */
		'.json': function (data) {
			return JSON.stringify(JSON.parse(data));
		},

		/**
		 * Convert text data to JS string.
		 * @param data {string}
		 * @return {string}
		 */
		'.tpl': function (data) {
			return '"' +
				data.replace(PATTERN_SPECIAL_CHAR, function (char) {
					return ESCAPE[char];
				}) + '"';
		}
	},

	Preprocessor = util.inherit(events.EventEmitter, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Process inline module.
		 * @param data {string}
		 * @param callback {Function}
		 */
		inline: function (data, callback) {
			var loader = this._config.loader,
				pathnames = [],
				self = this;

			PATTERN_INLINE.lastIndex = 0;

			while (re = PATTERN_INLINE.exec(data)) { // Assign.
				pathnames.push(re[2]);
			}

			loader.load(pathnames, function (files) {
				try {
					data = data
						.replace(PATTERN_INLINE, function (all, prefix, pathname) {
							return prefix
								+ parser[path.extname(pathname)](files[pathname]);
						});
					callback(data);
				} catch (err) {
					self.emit('error', err);
				}
			});
		},

		/**
		 * Preprocess source file.
		 * @param pathname {string}
		 * @param data {string}
		 * @param callback {Function}
		 */
		process: function (pathname, data, callback) {
			this.inline(this.normalizeId(pathname, data), function (data) {
				callback({
					pathname: pathname,
					data: data
				});
			});
		},

		/**
		 * Normalize Id to absolute pathname.
		 * @param pathname {string}
		 * @param data {string}
		 */
		normalizeId: function (pathname, data) {
			var self = this;

			return data
				.replace(PATTERN_SINGLE_ID, function (all, prefix, method, id) {
					id = self.resolveId(id, pathname);

					return util.format('%s%s("%s"', prefix, method, id);
				})
				.replace(PATTERN_MULTIPLE_ID, function (all, prefix, method, ids) {
					ids = ids.split(',')
						.map(function (value) {
							value = value.trim();
							return value && ('"' + self.resolveId(value.substring(1, value.length - 1), pathname) + '"');
						})
						.filter(function (value) {
							return value !== '';
						})
						.join(', ');

					return util.format('%s%s([ %s ]', prefix, method, ids);
				});
		},

		/**
		 * Resolve alias and relative pathname.
		 * @param id {string|Array}
		 * @param ref {string}
		 * @return {string}
		 */
		resolveId: function (id, ref) {
			if (util.isArray(id)) {
				return id.map(function (id) {
					return this.resolve(id, ref);
				}, this);
			}

			// Resolve alias.
			var alias = this._config.alias,
				parts = id.split('/'),
				first = parts[0];

			if (alias[first]) {
				parts[0] = alias[first];
			}

			id = parts.join('/');

			if (id.charAt(0) === '.') { // Relative pathname.
				id = url.resolve(ref, id);
			}

			switch (path.extname(id)) {
			case '.js': // Fall through.
			case '.css':
				id += '?{stamp}';
				break;
			case '': // Append default extname.
				id += '.js?{stamp}';
				break;
			}

			return id;
		}
	});

module.exports = Preprocessor;