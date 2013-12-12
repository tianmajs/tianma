<!doctype HTML>
<html>
<head>
<meta charset="utf-8" />
<title>天马HTTP服务器套件使用手册</title>
<style>
body {
font-family: Tahoma;
font-size: 10pt;
line-height: 170%;
padding: 0 10pt;
}

nav {
background: gray;
color: white;
overflow-x: hidden;
overflow-y: auto;
position: fixed;
top: 0;
left: 0;
bottom: 0;
width: 240px;
}

header {
padding-left: 240px;
}

header h1 {
color: #17365d;
font-size: 18pt;
font-weight: normal;
margin: 0;
padding: 0.5em 0;
text-align: right;
}

article {
padding-left: 240px;
}

article h2 {
border-bottom: dotted 1px #777;
color: #4f81bd;
font-size: 11pt;
margin: 1em 0;
padding: 0 0 0.3em 0;
}

article h3 {
color: #000;
font-size: 11pt;
margin: 1em 0;
padding: 0;
}

article h4 {
color: #000;
font-size: 10pt;
margin: 1em 0;
padding: 0;
}

article p {
margin: 1em 0;
}

article p code {
border: 1px solid #ccc;
color: #d14;
}

article p strong {
color: #f00;
}

article pre {
background: #eee;
border-left: solid 2px #3c0;
color: #000;
margin: 1em 0;
padding: 0 0 0 2em;
}

article blockquote {
background: #fff;
border: dashed 1px #777;
border-left: solid 2px #777;
color: #000;
margin: 0;
padding: 0 0 0 2em;
}

nav ul {
margin: 10px;
padding: 0;
}

nav a {
color: white;
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

footer {
padding-left: 240px;
}
</style>
</head>
<body>
<header>
<x-markdown src="section/00_header.md" />
</header>
<nav>
<x-index />
</nav>
<article>
<x-markdown src="section/01_getting_started.md" />
<x-markdown src="section/02_config.md" />
<x-markdown src="section/03_native_module.md" />
<x-markdown src="section/04_3rd_module.md" />
<x-markdown src="section/05_play.md" />
<x-markdown src="section/06_ssl.md" />
</article>
<footer>
<x-markdown src="section/99_footer.md" />
</footer>
</body>
</html>