'use strict';

var SourceNode = require('source-map').SourceNode,
	SourceMapConsumer = require('source-map').SourceMapConsumer,
	util = require('mini-util'),
	url = require('url');

var PATTERN_COMBO_URL = /^(\/.*?)\?\?(.*?)(\?.*)?$/,
	PATTERN_SOURCE_MAP = /\/[\/\*][@#]\s*sourceMappingURL=([^\s]*?)\s*(?:$|\*\/\s*$)/m,
	PATTERN_DATAURL = /^data:.*?base64,(.*)$/,

	DELIMITER = '\n',

	TPL_JS_MAP = '//# sourceMappingURL='
    		+ 'data:application/json;charset=utf-8;base64,%s',
    TPL_CSS_MAP = '/*# sourceMappingURL='
    		+ 'data:application/json;charset=utf-8;base64,%s*/',
	
	MAPPABLE = {
    	'application/javascript'   : TPL_JS_MAP,
    	'application/x-javascript' : TPL_JS_MAP,
    	'text/javascript'          : TPL_JS_MAP,
    	'text/css'                 : TPL_CSS_MAP
	};

/**
 * Parse combo-style URL.
 * @param url {string}
 * @return {Array|null}
 */
function parseURL(url) {
	var re, base, paths, search;
	
	if (re = url.match(PATTERN_COMBO_URL)) {
		base = re[1];
		search = re[3] || '?';
		
		paths = re[2].split(',').map(function (pathname) {
			return base + pathname + search;
		});
		
		return paths;
	}

	return null;
}

/**
 * Load files from subsequent filters.
 * @param req {Function}
 * @param res {Function}
 * @param path {string}
 * @param callback {Function}
 */
function loader(req, res, path, callback) {
	var re = path.match(PATTERN_DATAURL);
	
	if (re) { // Data URL.
		return callback(null, {
			path: path,
			data: new Buffer(re[1], 'base64').toString(),
			mime: 'application/json',
			mtime: Date.now()
		});
	}

	req.url(path)(function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, {
				path: req.path,
				data: res.toString(),
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
 * Createa a selfie map.
 * @param file {Object}
 * @return {Object}
 */
function selfie(file) {
	var sourceNode = new SourceNode(), codeMap,
		lines = file.data.split(DELIMITER),
		len = lines.length,
		i = 0,
		source = file.path.substring(1),
		delimiter;
		
	for (; i < len; ++i) {
		// Last line DO NOT need to append delimiter.
		delimiter = (i + 1 === len) ?
			'' : DELIMITER;
		sourceNode.add(new SourceNode(i + 1, 0,
			source, lines[i] + delimiter));
	}
	
	codeMap = sourceNode.toStringWithSourceMap();
	file.data = codeMap.code;

	return codeMap.map.toJSON();
}

/**
 * Relocate source map location.
 * @param referer {string}
 * @param map {string}
 * @return {Object}
 */
function relocate(referer, map) {
	map = JSON.parse(map);
	map.sources = map.sources.map(function (src) {
		return url.resolve(referer, src).substring(1);
	});
	
	return map;
}
	
/**
 * Load related source map.
 * @param file {Object}
 * @param loader {Function}
 * @param callback {Function}
 */
function loadMap(file, loader, callback) {
	var map, mapURL;
	
	file.data = file.data.replace(PATTERN_SOURCE_MAP, function (all, url) {
		mapURL = url;
		return '';
	});
	
	if (mapURL) {
		loader(url.resolve(file.path, mapURL), function (err, f) {
			if (!err) {
				try {
					map = relocate(file.path, f.data);
				} catch (e) {
					err = new Error('Invalid source map (' + f.path + ')');
				}
			}
			callback(err, map);
		});
	} else {
		callback(null, selfie(file));
	}
}

/**
 * Combine source maps.
 * @param file {Object}
 * @param tpl {string}
 * @param loader {Function}
 * @param callback {Function}
 */
function remap(files, tpl, loader, callback) {
	var sourceNode = new SourceNode(),
		codeMap, map;
		
	(function next(i, len) {
		if (i < len) {
			loadMap(files[i], loader, function (err, map) {
				if (err) {
					callback(err);
				} else {
					sourceNode.add(SourceNode.fromStringWithSourceMap(
						files[i].data + DELIMITER,
						new SourceMapConsumer(map)
					));
					next(i + 1, len);
				}
			});
		} else {
			codeMap = sourceNode.toStringWithSourceMap({
				sourceRoot: '/'
			});
			
			map = new Buffer(JSON.stringify(codeMap.map.toJSON()))
		    	.toString('base64');
		    	
		    callback(null, codeMap.code + util.format(tpl, map));
		}
	}(0, files.length));
}

/**
 * Combine files.
 * @param paths {Array}
 * @param loader {Function}
 * @param callback {Function}
 */
function combine(paths, loader, callback) {
	var tpl, files = [];
	var meta = {
		mime: null,
		mtime: 0
	};

	// Load Individual files.
	(function next(i, len) {
		if (i < len) {
			loader(paths[i], function (err, file) {
				if (err) {
					callback(err);
				} else {
					if (meta.mime && meta.mime !== file.mime) {
						callback(new Error('Inconsistent MIME type'));
					} else {
						meta.mime = file.mime;
					}
				
					meta.mtime = Math.max(meta.mtime, file.mtime);
					files.push(file);
					next(i + 1, len);
				}
			});
		} else if (tpl = MAPPABLE[meta.mime]) { // Assign.
			remap(files, tpl, loader, function (err, data) {
				callback(err, meta, data);
			});
		} else {
			callback(null, meta, files.map(function (file) {
				return file.data;
			}.join(DELIMITER)));
		}
	}(0, paths.length));
}

/**
 * Filter factory.
 * @return {Function}
 */
module.exports = function () {
	return function (req, res) {
		var load = loader.bind(null, req, res),
			path = req.path,
			paths;
			
		if (req.method() === 'GET' && (paths = parseURL(path))) { // Assign.
			// Avoid getting a 302 response.
			req.head('if-modified-since', '');
			
			// Combine Individual files.
			combine(paths, load, function (err, meta, data) {
				// Restore the original path.
				req.url(path);
				
				if (err) {
					res(err);
				} else {
					res.status(200)
						.head('content-type', meta.mime)
						.head('last-modified', new Date(meta.mtime)
							.toGMTString())
						.data(data)();
				}
			});
		} else {
			req(res);
		}
	};
};
