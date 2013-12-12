三方模块
-------------------

当天马的内置模块无法满足需求时，可以尝试编写或使用三方模块。天马定义了一套三方模块编写规范，并借助NPM构建了三方模块生态圈系统，能够简化开发者编写和发布三方模块，也能够简化用户下载和使用三方模块。

### 目录结构

三方模块按以下目录结构存放在网站工作目录下。

	- www/
		+ certificates/
		+ htdocs/
	    - node_modules/       # 三方模块存放目录
			- tianma-jsmin/   # 三方模块
				+ lib/
				package.json
				...
			...
		config.js
		readme.txt

可以看到，这是NodeJS三方包的标准存放方式。在编写天马三方模块时，建议使用`tianma-`作为模块名前缀，从而方便在GitHub或NPM仓库中搜索天马相关代码。

### 模块的加载

由于使用了`node_modules`目录存放三方模块，在配置文件中加载模块时当然可以使用`require('tianma-jsmin')`这种方式。不过天马自有一套更方便的方式。

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe('tianma-jsmin', { level: 1 })
			])
			.start();

可以看到，可以通过`tianma.pipe`方法加载三方模块。该方法要求三方模块的导出对象是一个工厂函数。工厂函数被调用时，接收传递给`pipe`方法的第2到第N个参数，并返回一个流水线模块函数。

另外，当`node_modules`目录下不存在指定模块时，`pipe`方法会自动调用NPM下载指定模块。如果模块名中使用`tianma-jsmin@1.0.0`的方式指定了版本号，`pipe`方法除了会下载指定版本的模块外，当`node_modules`目录下的模块与指定版本不匹配时，也会重新下载模块。

### 模块的编写

最简单的三方模块可以按以下方式编写：

	module.exports = function (config) {
		return function (context, next) {
			// Do something.
		};
	};

不过通常情况下我们可以使用[`pegasus.createPipe`](http://nqdeng.github.io/pegasus/#3.4)方法来简化复杂模块的编写，并使用标准的NPM目录结构来简化模块的发布和部署。

以`tianma-jsmin`模块为例，以下完整地说明一个标准的三方模块该怎么编写。首先是目录结构：

	- tianma-jsmin/
		- lib/
			index.js    # 入口模块
		package.json    # 包描述文件
		README.md       # 说明书

由于该模块的功能比较简单，所有代码都可以封装在`index.js`中。如果功能再复杂一些，就需要把代码拆分到`lib`目录下的多个文件中。`index.js`内容如下：

	var jsmin = require('jsmin').jsmin,
		pegasus = require('pegasus'),
		util = pegasus.util;

	var CONTENT_TYPES = [
			'text/javascript',
			'application/x-javascript',
			'application/javascript'
		];

	module.exports = pegasus.createPipe({
		_initialize: function (config) {
			this._config = util.mix({
				level: 2,
				comment: ''
			}, config);
		},

		main: function (request, response) {
			var config = this._config,
				data = response.body();

			data = jsmin(data, config.level, config.comment);

			response
				.clear()
				.write(data);

			this.next();
		},

		match: function (request, response) {
			var contentType = response.head('content-type') || '';

			return response.status() === 200
				&& CONTENT_TYPES.some(function (value) {
					return contentType.indexOf(value) !== -1;
				});
		}
	});

`package.json`中申明了模块名、版本号、入口模块位置和依赖，内容如下：

	{
		"name": "tianma-jsmin",
		"version": "1.0.0",
		"dependencies": {
			"jsmin": "1.0.x"
	  	},
		"main": "lib/index.js"
	}

有了以上目录结构和描述文件之后，该模块就可以通过NPM发布和下载了。

#### 异常处理

通常情况下，流水线模块代码在运行过程中产生的未捕获异常会让服务挂掉。如果希望仅为发生异常的请求返回500响应，而让服务保持运行的话，就需要手动捕获异常并使用[`pegasus.util.throwError`](http://nqdeng.github.io/pegasus/#6.1)方法再次抛出异常。

例如在上边的`tianma-jsmin`模块的代码中，当JS代码有语法错误时`jsmin`方法会抛出异常。我们需要对`main`方法做出以下调整，使得有异常发生时服务不至于挂掉。

	try {
		data = jsmin(data, config.level, config.comment);
	} catch (err) {
		util.throwError(err);
	}

另外，当模块代码在运行过程中发现有逻辑错误，需要主动抛出一个异常时，也需要使用`throwError`方法来代替`throw`关键字抛出异常，以保证仅仅是产生一个500响应，而不是让服务挂掉。

### 开发流程

开发一个三方模块时可以使用以下流程：

1. 使用`tianma deploy`命令部署一个工作目录，作为模块的调试环境。

2. 在工作目录下创建`node_modules`目录，并在其中创建模块目录并编写代码。

3. 在配置文件中使用`tianma.pipe`函数加载和调试模块。

4. 在模块目录下使用`npm publish`命令将三方模块发布到NPM仓库。

### 使用流程

使用一个三方模块时可以使用以下流程：

1. 在配置文件中使用`tianma.pipe`函数指定需要使用的三方模块名，以及可选的版本号，并根据需要传入模块配置。

2. 第一次使用某个三方模块时，天马会自动调用NPM下载。在下载完成前，三方模块所在流水线暂时处于不可用状态。如果希望服务启动后立即可用，或者因为各种原因三方模块自动下载失败，就可以在工作目录下运行类似`npm install tianma-jsmin@1.0.0`的命令来手动下载模块。
