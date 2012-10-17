/**
 * Tianma - Pipe - Refine - Minify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var css = require('clean-css'),
	custom = require('./custom'),
	uglify = require('uglify-js'),
	util = require('tianma').util;

	/**
	 * Minify JS using uglify-js.
	 * @param config {Object}
	 * @param data {string}
	 * @return {string}
	 */
var	minifyJS = function (config, data) {
		var jsp = uglify.parser,
			pro = uglify.uglify,
			ast;

		try {
			// parse code and get the initial AST
			ast = jsp.parse(data);

			if (config.mangle) {
				// get a new AST with mangled names
				ast = pro.ast_mangle(ast, { except: [ 'require', 'exports', 'module' ] });
			}

			if (config.squeeze) {
				// get an AST with compression optimizations
				ast = pro.ast_squeeze(ast);
			}

			// compressed code here
			data = pro.gen_code(ast);

			return data;
		} catch (err) {
			// Convert Uglify-JS error to Error object.
			throw new Error(util.format('%s at row: %d, col: %d', err.message, err.line, err.col));
		}
	},

	/**
	 * Minify CSS using clean-css.
	 * @param data {string}
	 * @return {string}
	 */
	minifyCSS = function (data) {
		return css.process(data);
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	minify = function (config) {
		config = util.mix({
			mangle: true,
			squeeze: true
		}, config);

		return custom({
			'.css': minifyCSS,
			'.js': minifyJS.bind(null, config)
		});
	};

module.exports = minify;