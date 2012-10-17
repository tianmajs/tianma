/**
 * Tianma - Pipe - Unicorn - Combo
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	util = require('tianma').util;

var LINK_TMPL = {
		'.css': '@import url("http://%s/??%s");',
		'.js': 'document.write(\'<script src="http://%s/??%s"></script>\');'
	},

	/**
	 * Concat files.
	 * @param files {Array}
	 * @return {Buffer}
	 */
	concat = function (files) {
		var output = [];

		// Output pathname for debugging.
		files.forEach(function (file) {
			output.push(util.format('/*! --------------------- START OF "%s" */', file.pathname));
			output.push(file.data.trim());
			output.push('/*! --- END */');
		});

		return output.join('\r\n');
	},

	/**
	 * Generate combined file or link file.
	 * @param files {Array}
	 * @param charset {string}
	 * @param host {string}
	 * @param combine {boolean}
	 * @return {Buffer}
	 */
	handle = function (files, charset, host, combine) {
		var	data;

		if (files.length <= 1 || combine) {
			data = concat(files);
		} else {
			data = link(files, host);
		}

		return util.encode(data, charset);
	},

	/**
	 * Link files.
	 * @param files {Array}
	 * @param host {string}
	 * @return {Buffer}
	 */
	link = function (files, host) {
		var output = [],
			extname;

		files.forEach(function (file) {
			extname = extname || path.extname(file.pathname);
			output.push(util.format(LINK_TMPL[extname], host, file.pathname));
		});

		return output.join('\r\n');
	};

exports.handle = handle;