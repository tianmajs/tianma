入门
-------------------

### 安装

首先请安装[NodeJS](http://nodejs.org)，然后在终端下使用以下命令安装天马。

	$ npm install tianma-beta -g

### 使用

安装好天马后，可以在终端下通过`tianma-beta`命令来使用各种功能，例如查看帮助：

	$ tianma-beta -h
	
	  Usage: tianma-beta [command] [config]
	  ...

#### 工作目录

搭建服务器前一般需要创建一个工作目录。以下是一个典型的工作目录：

	- home/admin/www/         # 工作目录
		- htdocs/                 # 网站根目录
			index.html                # 一些静态文件
			...                       ...
		config.js                # 默认配置文件

#### 配置文件

天马使用JS来配置服务器功能，我们可以把默认配置文件（*config.js*）的内容编辑如下，配置一个运行在80端口上的静态文件服务：

	var tianma = require('tianma');

	tianma(80)
	    .static('./htdocs');

>	天马自动通过`NODE_PATH`环境变量来指定`tianma`所在位置，因此工作目录下不需要使用NPM本地安装`tianma`也可以使用`require('tianma')`。

#### 启动和停止服务

在工作目录下打开终端，通过以下命令可以控制服务。

	$ pwd
	/home/admin/www                                  # 当前工作目录
	...
	$ tianma-beta                                    # 启动服务
	[23:37:28] Using "/home/admin/www/config.js"
	[23:37:28] Press [Ctrl+C] to stop..
	...
	$ tianma-beta start                              # 启动后台服务
	[23:37:28] Using "/home/admin/www/config.js"
	[23:37:28] Service started
	...
	$ tianma-beta restart                            # 重启当前后台服务
	[23:37:28] Service killed
	[23:37:28] Using "/home/admin/www/config.js"
	[23:37:28] Service started
	...
	$ tianma-beta stop                               # 停止当前后台服务
	[23:37:28] Service killed

>	后台服务启动后，即使关闭当前终端，服务依然继续运行。

另外，不使用默认配置文件时，可以通过`[config]`参数来指定配置文件路径。

	$ pwd
	/home/admin/www                                  # 当前工作目录
	$ tianma-beta foo.js                             # 指定配置文件启动服务
	[23:37:28] Using "/home/admin/www/foo.js"
	...
	$ tianma-beta start bar.js                       # 指定配置文件启动后台服务
	[23:37:28] Using "/home/admin/www/bar.js"
	[23:37:28] Service started

### 全局目录

全局目录位于`/home/<username>/.tianma`（Linux）或`C:/Users/<username>/.tianma`（Windows）。如果天马在工作目录下找不到指定的配置文件，会接着在全局目录中查找配置。

	$ pwd
	/home/admin/www                                  # 当前工作目录
	$ ls
	foo.js                                           # 工作目录下的配置文件
	$ ls ~/.tianma                                
	config.js  static.js                             # 全局目录下的配置文件
	$ tianma-beta
	[23:37:28] Using "/home/admin/.tianma/config.js" # 使用全局目录下的默认配置
	...
	$ tianma-beta static
	[23:37:28] Using "/home/admin/.tianma/static.js" # 使用全局目录下的自定义配置
	...
