var fs = require('fs'),
	path = require('path'),
	util = require('pegasus').util;

var PATTERN_FILENAME = /^(.*)\.(key|cer)$/,

	CA_DIR = './certificates',

	secureContext,

	/**
	 * Load secure context.
	 * @param defaultKey {Buffer}
	 * @return {Object}
	 */
	load = function () {
		if (!secureContext && fs.existsSync(CA_DIR)) {
			secureContext = {};

			// Read credentials.
			fs.readdirSync(CA_DIR).forEach(function (filename) {
				var re = filename.match(PATTERN_FILENAME),
					pathname;

				if (re) {
					pathname = path.join(CA_DIR, filename);
					save(re[1], re[2], fs.readFileSync(pathname));
				}
			}, this);

			// Remove incomplete credentials.
			util.each(secureContext, function (value, key, obj) {
				if (!value.key || !value.cert) {
					delete obj[key];
				}
			});
		}

		return secureContext || {};
	},

	/**
	 * Save credentials.
	 * @param hostname {string}
	 * @param type {string}
	 * @param data {Buffer}
	 */
	save = function (hostname, type, data) {
		var credentials = secureContext[hostname];

		if (!credentials) {
			credentials = secureContext[hostname] = {};
		}

		switch (type) {
		case 'cer':
			credentials.cert = data;
			break;
		case 'key':
			credentials.key = data;
			break;
		default:
		}
	};

exports.load = load;
