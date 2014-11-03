'use strcit';

var util = require('mini-util'),
	request = require('../../util/request');

var PATTERN_REPLACEMENT = /\$(\d+)/g,

	PATTERN_URL = /^(\w+\:)?\/\//;

/**
 * Filter factory.
 * @param [rules] {Object}
 * @return {Function}
 */
module.exports = function (rules) {
	rules = rules || {};
	
	/**
	 * Apply a matched rule.
	 * @param path {string}
	 * @return {string|null}
	 */
	function match(path) {
		var keys = util.keys(rules),
			len = keys.length,
			i = 0,
			replacement, pattern, re;

		for (; i < len; ++i) {
			replacement = keys[i];
			pattern = rules[replacement];
			
			if (re = path.match(pattern)) { // Assign.
				return replacement
					.replace(PATTERN_REPLACEMENT, function (all, index) {
						return re[index];
					});
			}
		}

		return null;
	}

	return function (req, res) {
		var href = match(req.path);

		if (href) {
			if (PATTERN_URL.test(href)) { // Proxy.
				request({
					method: req.method(),
					href: href,
					headers: util.merge(req.head()), // Make a copy.
					body: req.data()
				}, function (err, response) {
					if (err) {
						res(err);
					} else if (response.statusCode === 404) {
						res.status(response.statusCode)
							.head(response.headers)
							.data(response.body);
						req(res);
					} else {
						res.status(response.statusCode)
							.head(response.headers)
							.data(response.body)();
					}
				});
			} else { // Redirect.
				req.url(href)(res);
			}
		} else { // Need not to rewrite.
			req(res);
		}
	};
};