/*
** node-jsmin - a js minifier based on Doug Crockford's jsmin.c, based
** on Franck Marica's jsmin.js by Peteris Krumins.
*/

/*!
jsmin.js - 2010-01-15
Author: NanaLich (http://www.cnblogs.com/NanaLich)
Another patched version for jsmin.js patched by Billy Hoffman,
this version will try to keep CR LF pairs inside the important comments
away from being changed into double LF pairs.

jsmin.js - 2009-11-05
Author: Billy Hoffman
This is a patched version of jsmin.js created by Franck Marcia which
supports important comments denoted with /*! ...
Permission is hereby granted to use the Javascript version under the same
conditions as the jsmin.js on which it is based.

jsmin.js - 2006-08-31
Author: Franck Marcia
This work is an adaptation of jsminc.c published by Douglas Crockford.
Permission is hereby granted to use the Javascript version under the same
conditions as the jsmin.c on which it is based.

jsmin.c
2006-05-04

Copyright (c) 2002 Douglas Crockford  (www.crockford.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

The Software shall be used for Good, not Evil.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Update:
add level:
1: minimal, keep linefeeds if single
2: normal, the standard algorithm
3: agressive, remove any linefeed and doesn't take care of potential
missing semicolons (can be regressive)
*/

function jsmin(input, level, comment) {

  if (!input) return '';
  if (!level) level = 2;
  if (!comment) comment = '';

  var a = '',
		b = '',
		EOF = -1,
		LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		DIGITS = '0123456789',
		ALNUM = LETTERS + DIGITS + '_$\\',
		theLookahead = EOF;


  /* isAlphanum -- return true if the character is a letter, digit, underscore,
  dollar sign, or non-ASCII character.
  */

  function isAlphanum(c) {
	return c != EOF && (ALNUM.indexOf(c) !== -1 || c.charCodeAt(0) > 126);
  }


  /* getc(IC) -- return the next character. Watch out for lookahead. If the
  character is a control character, translate it to a space or
  linefeed.
  */

  var iChar = 0, lInput = input.length;
  function getc() {

	var c = theLookahead;
	if(iChar == lInput) {
	  return EOF;
	}
	theLookahead = EOF;
	if(c == EOF) {
	  c = input.charAt(iChar);
	  ++iChar;
	}
	if(c >= ' ' || c == '\n') {
	  return c;
	}
	if(c == '\r') {
	  return '\n';
	}
	return ' ';
  }
  function getcIC() {
	var c = theLookahead;
	if(iChar == lInput) {
	  return EOF;
	}
	theLookahead = EOF;
	if(c == EOF) {
	  c = input.charAt(iChar);
	  ++iChar;
	}
	if(c >= ' ' || c == '\n' || c == '\r') {
	  return c;
	}
	return ' ';
  }


  /* peek -- get the next character without getting it.
  */

  function peek() {
	theLookahead = getc();
	return theLookahead;
  }


  /* next -- get the next character, excluding comments. peek() is used to see
  if a '/' is followed by a '/' or '*'.
  */

  function next() {

	var c = getc();
	if(c == '/') {
	  switch(peek()) {
		case '/':
		  for(; ; ) {
			c = getc();
			if(c <= '\n') {
			  return c;
			}
		  }
		  break;
		case '*':
		  //this is a comment. What kind?
		  getc();
		  if(peek() == '!') {
			// kill the extra one
			getc();
			//important comment
			var d = '/*!';
			for(; ; ) {
			  c = getcIC(); // let it know it's inside an important comment
			  switch(c) {
				case '*':
				  if(peek() == '/') {
					getc();
					return d + '*/';
				  }
				  break;
				case EOF:
				  throw 'Error: Unterminated comment.';
				default:
				  //modern JS engines handle string concats much better than the
				  //array+push+join hack.
				  d += c;
			  }
			}
		  } else {
			//unimportant comment
			for(; ; ) {
			  switch(getc()) {
				case '*':
				  if(peek() == '/') {
					getc();
					return ' ';
				  }
				  break;
				case EOF:
				  throw 'Error: Unterminated comment.';
			  }
			}
		  }
		  break;
		default:
		  return c;
	  }
	}
	return c;
  }


  /* action -- do something! What you do is determined by the argument:
  1   Output A. Copy B to A. Get the next B.
  2   Copy B to A. Get the next B. (Delete A).
  3   Get the next B. (Delete B).
  action treats a string as a single character. Wow!
  action recognizes a regular expression if it is preceded by ( or , or =.
  */

  function action(d) {

	var r = [];

	if(d == 1) {
	  r.push(a);
	}

	if(d < 3) {
	  a = b;
	  if(a == '\'' || a == '"') {
		for(; ; ) {
		  r.push(a);
		  a = getc();
		  if(a == b) {
			break;
		  }
		  if(a <= '\n') {
			throw 'Error: unterminated string literal: ' + a;
		  }
		  if(a == '\\') {
			r.push(a);
			a = getc();
		  }
		}
	  }
	}

	b = next();

	if(b == '/' && '(,=:[!&|'.indexOf(a) !== -1) {
	  r.push(a);
	  r.push(b);
	  for(; ; ) {
		a = getc();
		if(a == '/') {
		  break;
		} else if(a == '\\') {
		  r.push(a);
		  a = getc();
		} else if(a <= '\n') {
		  throw 'Error: unterminated Regular Expression literal';
		}
		r.push(a);
	  }
	  b = next();
	}

	return r.join('');
  }


  /* m -- Copy the input to the output, deleting the characters which are
  insignificant to JavaScript. Comments will be removed. Tabs will be
  replaced with spaces. Carriage returns will be replaced with
  linefeeds.
  Most spaces and linefeeds will be removed.
  */

  function m() {

	var r = [];
	a = '';

	r.push(action(3));

	while(a != EOF) {
	  switch(a) {
		case ' ':
		  if(isAlphanum(b)) {
			r.push(action(1));
		  } else {
			r.push(action(2));
		  }
		  break;
		case '\n':
		  switch(b) {
			case '{':
			case '[':
			case '(':
			case '+':
			case '-':
			  r.push(action(1));
			  break;
			case ' ':
			  r.push(action(3));
			  break;
			default:
			  if(isAlphanum(b)) {
				r.push(action(1));
			  } else {
				if(level == 1 && b != '\n') {
				  r.push(action(1));
				} else {
				  r.push(action(2));
				}
			  }
		  }
		  break;
		default:
		  switch(b) {
			case ' ':
			  if(isAlphanum(a)) {
				r.push(action(1));
				break;
			  }
			  r.push(action(3));
			  break;
			case '\n':
			  if(level == 1 && a != '\n') {
				r.push(action(1));
			  } else {
				switch(a) {
				  case '}':
				  case ']':
				  case ')':
				  case '+':
				  case '-':
				  case '"':
				  case '\'':
					if(level == 3) {
					  r.push(action(3));
					} else {
					  r.push(action(1));
					}
					break;
				  default:
					if(isAlphanum(a)) {
					  r.push(action(1));
					} else {
					  r.push(action(3));
					}
				}
			  }
			  break;
			default:
			  r.push(action(1));
			  break;
		  }
	  }
	}

	return r.join('');
  }

  ret = m(input);

  if (comment) {
	return comment + '\n' + ret;
  }
  return ret;
}

/**
 * node-cssmin
 * A simple module for Node.js that minify CSS
 * Author : Johan Bleuzen
 */

/**
 * cssmin.js
 * Author: Stoyan Stefanov - http://phpied.com/
 * This is a JavaScript port of the CSS minification tool
 * distributed with YUICompressor, itself a port
 * of the cssmin utility by Isaac Schlueter - http://foohack.com/
 * Permission is hereby granted to use the JavaScript version under the same
 * conditions as the YUICompressor (original YUICompressor note below).
 */

/*
* YUI Compressor
* http://developer.yahoo.com/yui/compressor/
* Author: Julien Lecomte - http://www.julienlecomte.net/
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
* The copyrights embodied in the content of this file are licensed
* by Yahoo! Inc. under the BSD (revised) open source license.
*/

function cssmin(css, linebreakpos) {

	var startIndex = 0,
		endIndex = 0,
		i = 0, max = 0,
		preservedTokens = [],
		comments = [],
		token = '',
		totallen = css.length,
		placeholder = '';

	// collect all comment blocks...
	while ((startIndex = css.indexOf("/*", startIndex)) >= 0) {
		endIndex = css.indexOf("*/", startIndex + 2);
		if (endIndex < 0) {
			endIndex = totallen;
		}
		token = css.slice(startIndex + 2, endIndex);
		comments.push(token);
		css = css.slice(0, startIndex + 2) + "___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___" + css.slice(endIndex);
		startIndex += 2;
	}

	// preserve strings so their content doesn't get accidentally minified
	css = css.replace(/("([^\\"]|\\.|\\)*")|('([^\\']|\\.|\\)*')/g, function (match) {
		var i, max, quote = match.substring(0, 1);

		match = match.slice(1, -1);

		// maybe the string contains a comment-like substring?
		// one, maybe more? put'em back then
		if (match.indexOf("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_") >= 0) {
			for (i = 0, max = comments.length; i < max; i = i + 1) {
				match = match.replace("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + i + "___", comments[i]);
			}
		}

		// minify alpha opacity in filter strings
		match = match.replace(/progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi, "alpha(opacity=");

		preservedTokens.push(match);
		return quote + "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___" + quote;
	});

	// strings are safe, now wrestle the comments
	for (i = 0, max = comments.length; i < max; i = i + 1) {

		token = comments[i];
		placeholder = "___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + i + "___";

		// ! in the first position of the comment means preserve
		// so push to the preserved tokens keeping the !
		if (token.charAt(0) === "!") {
			preservedTokens.push(token);
			css = css.replace(placeholder,  "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
			continue;
		}

		// \ in the last position looks like hack for Mac/IE5
		// shorten that to /*\*/ and the next one to /**/
		if (token.charAt(token.length - 1) === "\\") {
			preservedTokens.push("\\");
			css = css.replace(placeholder,  "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
			i = i + 1; // attn: advancing the loop
			preservedTokens.push("");
			css = css.replace("___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + i + "___",  "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
			continue;
		}

		// keep empty comments after child selectors (IE7 hack)
		// e.g. html >/**/ body
		if (token.length === 0) {
			startIndex = css.indexOf(placeholder);
			if (startIndex > 2) {
				if (css.charAt(startIndex - 3) === '>') {
					preservedTokens.push("");
					css = css.replace(placeholder,  "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
				}
			}
		}

		// in all other cases kill the comment
		css = css.replace("/*" + placeholder + "*/", "");
	}


	// Normalize all whitespace strings to single spaces. Easier to work with that way.
	css = css.replace(/\s+/g, " ");

	// Remove the spaces before the things that should not have spaces before them.
	// But, be careful not to turn "p :link {...}" into "p:link{...}"
	// Swap out any pseudo-class colons with the token, and then swap back.
	css = css.replace(/(^|\})(([^\{:])+:)+([^\{]*\{)/g, function (m) {
		return m.replace(":", "___YUICSSMIN_PSEUDOCLASSCOLON___");
	});
	css = css.replace(/\s+([!{};:>+\(\)\],])/g, '$1');
	css = css.replace(/___YUICSSMIN_PSEUDOCLASSCOLON___/g, ":");

	// retain space for special IE6 cases
	css = css.replace(/:first-(line|letter)(\{|,)/g, ":first-$1 $2");

	// no space after the end of a preserved comment
	css = css.replace(/\*\/ /g, '*/');


	// If there is a @charset, then only allow one, and push to the top of the file.
	css = css.replace(/^(.*)(@charset "[^"]*";)/gi, '$2$1');
	css = css.replace(/^(\s*@charset [^;]+;\s*)+/gi, '$1');

	// Put the space back in some cases, to support stuff like
	// @media screen and (-webkit-min-device-pixel-ratio:0){
	css = css.replace(/\band\(/gi, "and (");


	// Remove the spaces after the things that should not have spaces after them.
	css = css.replace(/([!{}:;>+\(\[,])\s+/g, '$1');

	// remove unnecessary semicolons
	css = css.replace(/;+\}/g, "}");

	// Replace 0(px,em,%) with 0.
	css = css.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/gi, "$1$2");

	// Replace 0 0 0 0; with 0.
	css = css.replace(/:0 0 0 0(;|\})/g, ":0$1");
	css = css.replace(/:0 0 0(;|\})/g, ":0$1");
	css = css.replace(/:0 0(;|\})/g, ":0$1");

	// Replace background-position:0; with background-position:0 0;
	// same for transform-origin
	css = css.replace(/(background-position|transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin):0(;|\})/gi, function(all, prop, tail) {
		return prop.toLowerCase() + ":0 0" + tail;
	});

	// Replace 0.6 to .6, but only when preceded by : or a white-space
	css = css.replace(/(:|\s)0+\.(\d+)/g, "$1.$2");

	// Shorten colors from rgb(51,102,153) to #336699
	// This makes it more likely that it'll get further compressed in the next step.
	css = css.replace(/rgb\s*\(\s*([0-9,\s]+)\s*\)/gi, function () {
		var i, rgbcolors = arguments[1].split(',');
		for (i = 0; i < rgbcolors.length; i = i + 1) {
			rgbcolors[i] = parseInt(rgbcolors[i], 10).toString(16);
			if (rgbcolors[i].length === 1) {
				rgbcolors[i] = '0' + rgbcolors[i];
			}
		}
		return '#' + rgbcolors.join('');
	});


	// Shorten colors from #AABBCC to #ABC. Note that we want to make sure
	// the color is not preceded by either ", " or =. Indeed, the property
	//     filter: chroma(color="#FFFFFF");
	// would become
	//     filter: chroma(color="#FFF");
	// which makes the filter break in IE.
	css = css.replace(/([^"'=\s])(\s*)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi, function () {
		var group = arguments;
		if (
			group[3].toLowerCase() === group[4].toLowerCase() &&
			group[5].toLowerCase() === group[6].toLowerCase() &&
			group[7].toLowerCase() === group[8].toLowerCase()
		) {
			return (group[1] + group[2] + '#' + group[3] + group[5] + group[7]).toLowerCase();
		} else {
			return group[0].toLowerCase();
		}
	});

	// border: none -> border:0
	css = css.replace(/(border|border-top|border-right|border-bottom|border-right|outline|background):none(;|\})/gi, function(all, prop, tail) {
		return prop.toLowerCase() + ":0" + tail;
	});

	// shorter opacity IE filter
	css = css.replace(/progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi, "alpha(opacity=");

	// Remove empty rules.
	css = css.replace(/[^\};\{\/]+\{\}/g, "");

	if (linebreakpos >= 0) {
		// Some source control tools don't like it when files containing lines longer
		// than, say 8000 characters, are checked in. The linebreak option is used in
		// that case to split long lines after a specific column.
		startIndex = 0;
		i = 0;
		while (i < css.length) {
			i = i + 1;
			if (css[i - 1] === '}' && i - startIndex > linebreakpos) {
				css = css.slice(0, i) + '\n' + css.slice(i);
				startIndex = i;
			}
		}
	}

	// Replace multiple semi-colons in a row by a single one
	// See SF bug #1980989
	css = css.replace(/;;+/g, ";");

	// restore preserved comments and strings
	for (i = 0, max = preservedTokens.length; i < max; i = i + 1) {
		css = css.replace("___YUICSSMIN_PRESERVED_TOKEN_" + i + "___", preservedTokens[i]);
	}

	// Trim the final string (for any leading or trailing white spaces)
	css = css.replace(/^\s+|\s+$/g, "");

	return css;
}

exports.jsmin = function (source) {
	try {
		return jsmin(source);
	} catch (err) { // Refine error message.
		throw new Error(err.trim().replace('Error: ', ''));
	}
};

exports.cssmin = function (source) {
	return cssmin(source);
};

