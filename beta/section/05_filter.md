模块
-------------------

天马模块是一个NPM模块。

### 命名规则

模块名统一使用`tianma-`前缀，全部使用小写字母，单词之间使用`-`分隔。例如:

	tianma-static
	tianma-print-error
	
### 目录结构

	- tianma-xxx/
		+ lib/
		+ test/
		index.js
		package.json
		README.md
		
### 模块接口

模块使用工厂函数作为接口：

	module.exports = function (config) {
		// Initiate.
		return function* (next) {
			// Handle request.
		};
	};
	
### 请求处理逻辑

+ 如果一个模块能够处理请求，可以通过`response`对象写入响应数据后，直接调用`done`。

+ 如果一个模块不能够处理请求，或者需要等到后续模块处理请求后再对响应数据做二次加工，可以先通过`next`方法将请求交给后续模块处理，再等到响应返回后接着处理。

### 模块发布

通过`npm publish`发布。

### 模块使用

首先安装天马，以及需要的模块。

	$npm install tianma@beta
	$npm install tianma-static
	
然后既可以按照普通方式使用：

	var tianma = require('tianma');
	var tstatic = require('tianma-static');
	
	tianma(80)
		.pipe(tstatic('./htdocs');
		
又可以按照链式方法方式使用：

	var tianma = require('tianma');
	var tstatic = require('tianma-static');
	
	tianma(80)
		.static('./htdocs');