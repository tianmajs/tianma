/**
 * Tianma - Pipe - Refine - Beautify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var css = require('cssunminifier'),
	custom = require('./custom'),
	uglify = require('uglify-js');

	/**
	 * Beautify JS using uglify-js.
	 * @param data {string}
	 * @return {string}
	 */
var	beautifyJS = function (data) {
		var jsp = uglify.parser,
			pro = uglify.uglify,
			ast;

		try {
			// parse code and get the initial AST
			ast = jsp.parse(data);

			// compressed code here
			data = pro.gen_code(ast, {
				beautify: true
			});

			return data;
		} catch (err) {
			// Convert Uglify-JS error to Error object.
			throw new Error(util.format('%s at row: %d, col: %d', err.message, err.line, err.col));
		}

	},

	/**
	 * Beautify CSS using cssunminifier.
	 * @param data {string}
	 * @return {string}
	 */
	beautifyCSS = function (data) {
		return css.unminify(data);
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	beautify = function (config) {
		return custom({
			'.css': beautifyCSS,
			'.js': beautifyJS
		});
	};

module.exports = beautify;