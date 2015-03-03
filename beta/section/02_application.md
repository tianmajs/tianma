应用
-------------------

创建一个应用，然后创建一个HTTP服务器：

	var http = require('http');
	var tianma = require('tianma');
	var app = tianma();
	
	http.createServer(app.run).listen(8080);
	
或者在创建应用时自动创建一个HTTP服务器：

	var tianma = require('tianma');
	var app = tianma(8080);
	
在应用上挂载模块：

	app.use(function* (next) {      |
		// ...                      |      R
	}).use(function* (next) {       |     / \
		// ...                      |    *   *
	});                             |
	
