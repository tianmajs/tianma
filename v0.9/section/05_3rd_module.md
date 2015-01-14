第三方模块
-------------------

第三方模块也属于自定义模块，但是需要*封装*为独立的NodeJS模块以便于发布到NPM上提供给其他用户使用。此外，第三方模块对*代码规范*与*代码质量*有更高的要求，毕竟没人愿意使用不好的模块。

### 开发目录

编写第三方模块之前一般需要准备一个*开发目录*，便于*组织代码*和*调试代码*。以下是一个典型的开发目录：

	- home/admin/dev/             # 开发目录
		- node_modules/               # 模块目录
			- tianma-profile/              # 开发中的第三方模块
				test/                         # 存放测试用例
				index.js                      # 第三方模块代码
				package.json                  # 模块描述文件
				README.md                     # 文档
		config.js                     # 调试第三方模块使用的天马配置文件

### 代码范例

第三方模块需要允许用户通过参数配置模块行为，因此需要提供一个模块*工厂函数*，才能够通过天马内置的`use`模块加载。以下是一个第三方模块代码的标准范例：

	// tianma-profile/index.js

	/* 工厂函数，支持传入配置对象 */
	module.exports = function (config) {
		/* 初始化模块配置 */

		var keyName = (config || {}).keyName || 'x-process-time';

		/* 返回模块函数 */

		return function (req, res) {
			var start = new Date;

			req(function (err) {
				if (err) {
					res(err);
				} else {
					res.head(keyName, new Date() - start);
					res();
				}
			});
		};
	};

#### 异常处理

待补充。

#### 日志输出

待补充。

### 测试用例规范

待补充。

### 代码调试

可以通过天马内置的`use`模块加载和调试开发中的第三方模块。

	// config.js
	var tianma = require('tianma');

	tianma()
		.use('tianma-profile', { keyName: 'x-render-time' })
		.static();

### 模块发布

使用标准的`npm publish`命令将开发好的第三方模块发布到NPM上即可。此外，为了便于使用者搜索到天马的第三方模块，建议模块名以`tianma-`为前缀。