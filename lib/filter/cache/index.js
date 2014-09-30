'use strict';

var LRU = require('lru-cache'),
	util = require('mini-util');

/**
 * Filter factory.
 * @param [maxAge] {number}
 * @return {Function}
 */
module.exports = function (maxAge) {
	maxAge = (maxAge || 1800) * 1000;
	
	var lru = LRU({
		max: 1024,
		maxAge: maxAge
	});
	
	function cache(req, res) {
		var key = req.url(),
			entry = lru.get(key),
			now = Date.now(),
			// No IMS header equals the client has a cache
			// as old as the universe.
			ims = new Date(req.head('if-modified-since') || 0),
			// No LRU entry equals the server has a cache
			// as new as freshly baked break.
			lm = new Date(entry ? entry.headers['last-modified'] : now);
		
		if (ims >= lm) {
			res.status(304)
				.head('last-modified', lm)();
		} else if (entry) {
			res.status(200)
				.head(entry.headers)
				.data(entry.body)();
		} else {

			req(function (err) {
				if (err || res.status() !== 200) {
					res(err);
				} else {
					lm = new Date(res.head('last-modified') || now);
				
					res.head({
						'last-modified': lm.toGMTString(),
						'expires': new Date(now + maxAge).toGMTString(),
						'cache-control': 'max-age=' + maxAge / 1000
					});
					
					lru.set(key, {
						headers: res.head(),
						body: res.data()
					});
					
					// Now the LRU cache is warmed, we can handle the request
					// with the corrent Last-Modifled time again.
					cache(req, res);
				}
			});
		}
	}
	
	return function (req, res) {
		if (req.method() === 'GET') {
			cache(req, res);
		} else {
			req(res);
		}
	};
};
