<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>天马HTTP服务器套件使用手册</title>
<style>
html, body {
margin: 0;
padding: 0;
}

body {
background: #777;
font-family: sans-serif;
line-height: 170%;
}

header, nav, article, footer {
display: block;
}

#wrapper {
background: #fff;
margin: 0 auto;
max-width: 1200px;
}

#menu {
background: #000;
border-radius: 24px;
bottom: 30px;
display: none;
height: 48px;
opacity: 0.5;
position: fixed;
right: 30px;
transition: opacity 0.3s ease;
width: 48px;
}

#menu span {
background: #ccc;
display: block;
height: 3px;
margin: 5px auto;
width: 24px;
}

#menu span.first {
margin-top: 15px;
}

.show-menu #menu {
opacity: 0.75;
}

.show-menu #menu span {
background: #fff;
}

nav {
background: #fff;
border-right: 5px solid #777;
bottom: 0;
color: #333;
font-size: 10pt;
overflow-x: hidden;
overflow-y: auto;
padding: 20px 0 20px 40px;
position: fixed;
top: 0;
width: 195px;
}

nav ul {
margin: 0;
padding: 0;
}

nav a {
color: #777;
text-decoration: none;
}

nav a:hover {
text-decoration: underline;
}

nav li {
list-style: none;
margin: 0;
padding: 0;
}

nav .level2 {
font-size: 11pt;
font-weight: bold;
}

nav .level3 {
padding-left: 1em;
}

nav .level3:before { 
content: "» ";
}

nav .level4 {
padding-left: 2em;
}

nav .level4:before { 
content: "› ";
}

article {
color: #333;
font-size: 11pt;
margin-left: 240px;
padding: 40px;
position: relative;
word-break: break-all;
}

article .logo {
background: right top no-repeat url(data:image/png;base64,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);
height: 160px;
width: 222px;
position: absolute;
right: 30px;
top: 0;
}

header {
border-bottom: solid 2px #333;
height: 90px;
margin-bottom: 30px;
}

header h1 {
color: #f60;
font-family: monospace;
font-size: 20pt;
margin: 0 0 2pt 0;
}

header h1 sup {
color: #f90;
font-size: 11pt;
}

header .link {
float: right;
font-size: 9pt;
}

header .comment {
color: #777;
font-family: monospace;
font-size: 10pt;
}

article h2 {
border-bottom: dotted 1px #777;
font-size: 16pt;
margin: 2em 0 1em;
padding: 0 0 0.3em 0;
}

article h2:before {
content: "# ";
}

article h3 {
font-size: 14pt;
margin: 1.5em 0 1em 0;
padding: 0;
}

article h4 {
font-size: 11pt;
margin: 1em 0;
padding: 0;
}

article a {
color: #06f;
font-weight: bold;
}

article p {
margin: 1em 0;
}

article p em {
border-bottom: 2px solid #f90;
font-style: normal;
}

article p strong {
border-bottom: 2px solid #c00;
}

article p code {
background: #eee;
border-radius: 5px;
font-size: 10pt;
padding: 0.2em;
}

article pre {
color: #666;
font-size: 10pt;
line-height: 140%;
margin: 1em 0;
overflow-x: auto;
overflow-y: padding;
padding: 0 2em;
}

article blockquote {
border-left: solid 2px #f90;
margin: 1em 0;
padding: 0 0 0 2em;
}

footer {
border-top: 1px solid #ccc;
font-size: 10pt;
font-weight: bold;
margin-top: 4em;
}

@media (max-width: 768px) {
	#menu {
	display: block;
	}

	nav {
	border-right: none;
	line-height: 240%;
	margin-left: -240px;
	transition: margin 0.3s ease;
	width: 200px;
	}

	.show-menu nav {
	box-shadow: 5px 5px 5px #777;
	margin-left: 0;
	}

	article {
	margin-left: 0;
	padding: 20px;
	}

	article .logo {
	right: 10px;
	}
}

@media (max-width: 480px) {
	article {
	padding: 10px;
	}

	article .logo {
	right: 0;
	}
}
</style>
<script>
(function (tags) {
	var i = 0, len = tags.length;

	for (; i < len; ++i) {
	    document.createElement(tags[i]);
	}
}([ 'header', 'nav', 'article', 'footer' ]));
</script>
</head>
<div id="wrapper">
<div id="menu">
<span class="first"></span>
<span></span>
<span></span>
</div>
<nav>
<x-index />
</nav>
<article>
<div class='logo'></div>
<header>
<h1>Tianma();<sup>0.9.x beta</sup></h1>
<div class="comment">// All-purpose toybox</div>
</header>
<x-markdown src="section/00_intro.md" />
<x-markdown src="section/01_getting_started.md" />
<x-markdown src="section/02_config.md" />
<x-markdown src="section/03_native_module.md" />
<x-markdown src="section/04_custom_module.md" />
<x-markdown src="section/05_3rd_module.md" />
<x-markdown src="section/06_links.md" />
<footer>
<x-markdown src="section/99_footer.md" />
</footer>
</article>
<script>/*
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-48219354-1', 'nqdeng.github.io');
  ga('send', 'pageview');*/

(function () {
	var wrapper = document.getElementById('wrapper'),
		article = document.getElementsByTagName('article')[0],
		menu = document.getElementById('menu');

	menu.addEventListener &&
	menu.addEventListener('click', function (e) {
		if (!wrapper.className) {
			wrapper.className = 'show-menu';
		} else {
			wrapper.className = '';
		}
	});

	article.addEventListener &&
	article.addEventListener('click', function (e) {
		wrapper.className = '';
	});
}());
</script>
</div>
</body>
</html>