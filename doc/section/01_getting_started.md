入门
-------------------

当前端工程师需要一个HTTP服务器来辅助开发或自娱自乐时，有以下选择——

	Apache     PHP 
	   Nginx   Java
	IIS  .NET  ...

但如果你觉得以上技术要么太重、要么太难、要么不好玩的时候，请试试看基于NodeJS的天马HTTP服务器套件（以下简称天马）。

天马构建在基于路由器和流水线的HTTP处理模型之上，不但提供静态服务、模板渲染、反向代理、请求合并、缓存、HTTP压缩等内置模块，还提供了简单易懂的三方模块编写机制，允许前端快速定制各种HTTP服务器。

### 安装

首先请安装NodeJS **0.10.0**以上版本，然后在终端下使用以下命令安装天马。

	$ npm install tianma -g

### 使用

安装好天马后，可以在终端下通过`tianma`命令来使用各种功能，例如查看当前版本：

	$ tianma -V
	0.8.0

#### 工作目录

搭建服务器前需要准备一个工作目录，用于保存服务器配置、SSL证书、日志等文件。原则上可以手工创建工作目录，不过使用`tianma`命令会更方便些：

	$ tianma deploy /home/user/www
	create : /home/user/www
	...

自动创建的工作目录内容如下：

	- www/                # 工作目录
		+ certificates/   # SSL证书目录
		+ htdocs/         # 网站根目录
		config.js         # 服务器默认配置文件
		readme.txt        # 说明文件

#### 配置文件

配置文件决定了服务器提供的功能，首先来看看默认配置文件（config.js）有什么内容。

	var tianma = require('tianma'),
		pipe = tianma.pipe;

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				pipe.static({ root: './htdocs' })
			])
			.start();

可以看到，对于配置天马而言，与其说是填写配置项，不如说是使用天马提供的API来编写一个NodeJS程序。

>	**解惑：** 细心的同学会发现`require('tianma')`有些奇怪，因为工作目录下并没有`tianma`这个三方包。其中的奥妙在于配置文件是通过`tianma`命令间接运行的，在运行前天马会通过`NODE_PATH`环境变量指定`tianma`三方包所在位置。

#### 启动和停止服务

服务器可以使用前台和后台两种运行模式。在工作目录下打开终端，通过以下命令可控制服务。

	$ tianma start              # 启动后台服务
	[i] Service started.

	$ tianma restart            # 重启当前后台服务
	[i] Service killed.
	[i] Service started.

	$ tianma stop               # 停止后台服务
	[i] Service killed.

	$ tianma run                # 启动前台服务
	[i] Press [Ctrl+C] to stop service..

启动前台服务时，通过`console.log`和`console.error`输出的信息会直接打印在终端上，并且关闭当前终端窗口会停掉服务。而启动后台服务时，`console.log`的输出会被忽略，`console.error`的输出会被重定向到日志文件里，并且关闭当前终端窗口后服务依然继续运行。

另外，如果配置文件不叫做`config.js`，或者不位于当前工作目录下，启动服务时需要在命令后边加上配置文件的路径，例如`tianma start config2.js`。

>	**注意：** 由于HTTP(S)的默认端口是80和443，而*nix系统下又只有root用户能使用1024以下端口号，因此需要使用`sudo`来控制服务，例如`sudo tianma start`。

#### 快捷服务

使用以下命令可以指定网站根目录并使用80端口快速启动一个HTTP静态服务器。省略路径时，使用当前目录作为根目录。

	$ tianma express /home/admin/htdocs
	Press [Ctrl+C] to stop service..

想在两台机器间拷贝些文件时，就可以使用这招，通过HTTP下载的方式达到目的。
