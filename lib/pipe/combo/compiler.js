/**
 * Tianma - Pipe - Combo - Compiler
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */
var depsParser = require('./dependenciesParser'),
	path = require('path');

var PATTERN_IMAGE_URL = /url\s*\(\s*["']?(.*?\.(?:png|gif|jpg|jpeg))["']?\s*\)/gim,

	PATTERN_STAMP = /(['"])([^'"]+?\.(?:js|css))\?\{stamp\}(['"])/g,

	/**
	 * Compile file.
	 * @param file {Object}
	 * @param options {Object}
	 * @param callback {Function}
	 */
	compile = function (file, options, callback) {
		var extname = path.extname(file.pathname);

		if (extname === '.js') {
			compileJS(file, options, callback);
		} else if (extname === '.css') {
			compileCSS(file, options, callback);
		} else {
			callback(null, file);
		}
	},

	/**
	 * Compile css file.
	 * @param file {Object}
	 * @param options {Object}
	 * @param callback {Function}
	 */
	compileCSS = function (file, options, callback) {
		file.data = file.data.replace(PATTERN_IMAGE_URL, function (all, href) {
			if (href.indexOf('/') === 0) {
				return options.ssl ?
					'url(https://stylessl.aliunicorn.com' + href + ')' :
					'url(http://i02.i.aliimg.com' + href + ')';
			} else {
				return all;
			}
		});

		callback(null, depsParser.parse(file));
	},

	/**
	 * Compile js file.
	 * @param file {Object}
	 * @param options {Object}
	 * @param callback {Function}
	 */
	compileJS = function (file, options, callback) {
		file.data = file.data.replace(PATTERN_STAMP, function (all, lquote, href, rquote) {
			return lquote + href + '?t=0_0' + rquote;
		});

		callback(null, depsParser.parse(file));
	};

exports.compile = compile;
