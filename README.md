天马HTTP中间件
=============

喜欢以路由规则和流水线的方式编写NodeJS HTTP服务器的同学请看过来。

	pegasus()
		.mount('/', [
			function (context) {
				context.response
					.status(200)
					.data('Hello World!');
			}
		});

如果你觉得上边的API风格还不错的话，可以看看[**天马HTTP中间件使用手册**](http://nqdeng.github.io/pegasus)，里边有详尽的文档。

看完之后，如果你决定要使用中间件写点代码，在动手之前也不妨再看看[**天马HTTP服务器套件使用手册**](http://nqdeng.github.io/pegasus)，或许这就是你想要的。

当然，如果你还是觉得基于中间件自己二次开发比较靠谱的话，请尽情使用，有任何问题和建议的话也请随时反馈 : )
