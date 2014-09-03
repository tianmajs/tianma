'use strict';

var fs = require('fs'),
	path = require('path'),
	hash = require('./util/hash'),
	request = require('./util/request');

/**
 * Compile config file to function.
 * @param code {string}
 * @param config {Object}
 * @return {Function}
 */
function compile(code, config) {
	var context = {
		require: require,
		exports: exports,
		module: module,
		config: config
	};

	return new Function('context', 'with (context) {'
		+ code
		+  '}').bind(null, context);
}

/**
 * Load config file.
 * @param href {string}
 * @param callback {Function}
 */
function load(href, callback) {
	var cache = path.join('./tmp', hash(href)),
		headers = {},
		mtime;

	if (!fs.existsSync('./tmp')) {
		fs.mkdirSync('./tmp');
	}

	if (fs.existsSync(cache)) {
		mtime = fs.statSync(cache).mtime;
		headers['if-modified-since'] = mtime.toGMTString();
	}
	
	var options = {
		href: href,
		headers: headers
	};
	
	request(options, function (err, response) {
		if (err) {
			err.code = 'EPLAY';
			err.vars = [ options.href ];
			throw err;
		} else if (response.statusCode === 200) { // Update local cache.
			fs.writeFileSync(cache, response.body);

			if (response.headers['last-modified']) { // Sync modified date.
				mtime = new Date(response.headers['last-modified']);
				fs.utimesSync(cache, mtime, mtime);
			}

			callback(response.body.toString());
		} else if (mtime || fs.existsSync(cache)) { // Use local cache.
			callback(fs.readFileSync(cache, 'utf-8'));
		} else {
			err = new Error();
			err.code = 'EPLAY';
			err.vars = [ options.href ];
			throw err;
		}
	});
}

/**
 * Start service with a remote config file.
 * @param href {string}
 * @param [config] {Object}
 */
function play(href, config) {
	console.log('Using remote config "%s"..', href);
	load(href, function (data) {
		compile(data, config || {}).apply(null);
	});
}

module.exports = play;
