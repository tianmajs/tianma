'use strict';

var mime = require('mime-types'),
	path = require('path'),
	util = require('mini-util');

var PATTERN_COMBO_URL = /^(\/.*?)\?\?(.*?)(\?.*)?$/;

function parseURL(url) {
	var re, base, pathnames, search;
	
	if (re = url.match(PATTERN_COMBO_URL)) {
		base = re[1];
		
		pathnames = re[2].split(',').map(function (pathname) {
			return base + pathname;
		});
		
		search = re[3] || '';
		
		return {
			pathnames: pathnames,
			search: search
		};
	}

	return null;
}

function loader(req, res, pathname, callback) {
	req.url(pathname)(function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, {
				data: res.data(),
				mime: res.type()
					// Set a default MIME.
					|| 'application/octet-stream',
				mtime: new Date(
					res.head('last-modified')
					// Set default mtime to now.
					|| Date.now()).getTime()
			});
		}
	});
}

/**
 * Filter factory.
 * @param [delimiter] {Object}
 * @return {Function}
 */
module.exports = function (delimiter) {
	delimiter = delimiter || {
		'js': '\n',
		'css': '\n'
	};
	
	util.each(delimiter, function (content, type) {
		type = mime.lookup(type);
		delimiter[type] = content;
	});
	
	function combo(req, res) {
		var load = loader.bind(null, req, res),
			path = req.path,
			ret, mime, mtime = 0,
			datum = [];
			
		if (ret = parseURL(path)) {
			(function next(i, len) {
				if (i < len) {
					load(ret.pathnames[i] + ret.search, function (err, file) {
						if (err) {
							done(err);
						} else {
							if (mime && mime !== file.mime) {
								done(new Error('Inconsistent MIME type'));
							} else {
								mime = file.mime;
							}
							
							mtime = Math.max(mtime, file.mtime);
							datum.push(file.data, delimiter[mime]);
							next(i + 1, len);
						}
					});
				} else {
					done();
				}
			}(0, ret.pathnames.length));
			
			function done(err) {
				// Restore the original path.
				req.url(path);
				
				if (err) {
					res(err);
				} else {
					res.status(200)
						.head('content-type', mime)
						.head('last-modified', new Date(mtime).toGMTString())
						.data(datum)();
				}
			}
		} else {
			req(res);
		}
	}

	return function (req, res) {
		if (req.method() === 'GET') {
			combo(req, res);
		} else {
			req(res);
		}
	};
};

