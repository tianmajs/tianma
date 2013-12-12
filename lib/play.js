var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

	/**
	 * Compile config file to function.
	 * @param code {string}
	 * @param config {Object}
	 * @return {Function}
	 */
var compile = function (code, config) {
		var context = {
				require: require,
				exports: exports,
				module: module,
				config: config
			};

		return new Function('context', 'with (context) {'
			+ code
			+  '}').bind(null, context);
	},

	/**
	 * Calculate SHA1.
	 * @param data {string}
	 * @return {string}
	 */
	hash = function (data) {
		if (util.isString(data)) {
			data = new Buffer(data);
		}

		return crypto.createHash('sha1')
			.update(data)
			.digest('hex');
	},

	/**
	 * Load config file.
	 * @param href {string}
	 * @param callback {Function}
	 */
	load = function (href, callback) {
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

		util.request({
			href: href,
			headers: headers
		}, function (response) {
			if (response.statusCode === 200) { // Update local cache.
				fs.writeFileSync(cache, response.body);

				if (response.headers['last-modified']) { // Sync modified date.
					mtime = new Date(response.headers['last-modified']);
					fs.utimesSync(cache, mtime, mtime);
				}

				callback(response.body.toString());
			} else if (mtime || fs.existsSync(cache)) { // Use local cache.
				callback(fs.readFileSync(cache, 'utf8'));
			} else {
				util.error(new Error(
					util.format('Cannot load "%s"', href)).stack);
			}
		});
	},

	/**
	 * Start service with a remote config file.
	 * @param href {string}
	 * @param [config] {Object}
	 */
	play = function (href, config) {
		load(href, function (data) {
			compile(data, config || {}).apply(null);
		});
	};

module.exports = play;
