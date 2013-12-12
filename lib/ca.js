var fs = require('fs'),
	path = require('path'),
	util = require('pegasus').util;

var PATTERN_FILENAME = /^(.*)\.(key|cer)$/,

	CA_DIR = './certificates',

	secureContext = null,

	/**
	 * Module initializer.
	 */
	initialize = function () {
		secureContext = {};

		if (!fs.existsSync(CA_DIR)) {
			return;
		}

		// Read credentials.
		fs.readdirSync(CA_DIR).forEach(function (filename) {
			var re = filename.match(PATTERN_FILENAME),
				pathname, hostname, type, data, credentials;

			if (re) {
				pathname = path.join(CA_DIR, filename);
				hostname = re[1];
				type = re[2];
				data = fs.readFileSync(pathname);

				credentials = secureContext[hostname];

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
			}
		});

		// Remove un-paired credentials.
		util.each(secureContext, function (value, key, obj) {
			if (!value.key || !value.cert) {
				delete obj[key];
			}
		});
	};

module.exports = function () {
	if (!secureContext) {
		initialize();
	}
	return secureContext;
};
