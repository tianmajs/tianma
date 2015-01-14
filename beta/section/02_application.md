应用
-------------------

创建一个监听器，然后创建一个HTTP服务器：

	var http = require('http');
	var tianma = require('tianma');
	var app = tianma();
	
	http.createServer(app).listen(8080);
	
或者在创建监听器时自动创建一个HTTP服务器：

	var tianma = require('tianma');
	var app = tianma(8080);
	
在监听器上链式挂载模块：

	app.pipe(function* (next) {     |      R
		// ...                      |      |
	}).pipe(function* (next) {      |      *
		// ...                      |      |
	});                             |      *
	
在监听器上树式挂载模块：

	app.pipe(function* (next) {     |
		// ...                      |      R
	});                             |     / \
	app.pipe(function* (next) {     |    *   *
		// ...                      |
	});                             |
	
