tern.yuidoc
===========

[![Build Status](https://secure.travis-ci.org/angelozerr/tern.yuidoc.png)](http://travis-ci.org/angelozerr/tern.yuidoc)

Generates [Tern plugin](http://ternjs.net/doc/manual.html#plugins) for : 

 * [YUI](http://yuilibrary.com/) Javascript framework.
 * [AlloyUI](http://alloyui.com/) Javascript framework.
 
from their Javascript sources by using [yuidoc](https://github.com/yui/yuidoc/).

## Demo

You can see demo :

 * with yui.js tern plugin [here](http://codemirror-java.opensagres.eu.cloudbees.net/codemirror-javascript/demo/yui.html).
 * with yui.js tern plugin [here](http://codemirror-java.opensagres.eu.cloudbees.net/codemirror-javascript/demo/aui.html).
 
## How it works? 

Today tern def generation is done at hand. It should be very cool if grunt tasks will exists. 

Any contributions are welcome!

### data.json

Generates YUI data.json with yuidoc. Get sources of YUI from GitHub https://github.com/yui/yui3 Set your cd path to src dir 

	cd /you/path/to/yui3/src
	
and launch the command :

	yuidoc -p 
	
See http://yui.github.io/yuidoc/args/index.html for more info.	

### data.json -> tern def

 * Copy you data.json to generator/yui for YUI and generator/aui for AlloyUI. 
 * Rename it data.json to yui.data.json.js or aui.data.json.js and add 'var yuiDoc = ' on the top of the file.
 * open yui2tern.html or aui2tern.html to generate tern def from the data.json in the textarea.
 * copy/paste the content of the textarea and replace 'var defs' from the '/plugin/yui.js' or '/plugin/aui.js'

## Structure

The basic structure of the project is given in the following way:

* `demos/` demos with YUI and AlloyUI tern plugin which use CodeMirror.
* `generator/` generates YUI and AlloyUI tern plugin from yuidoc data.json by using HTML pages.
* `lib/` lib to  transform yuidoc data.json to tern def.
* `plugin/` YUI and  AlloyUI tern plugin where defs was generated with lib. 