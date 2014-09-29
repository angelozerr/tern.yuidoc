(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern"], mod);
  mod(tern, tern);
})(function(infer, tern) {
  "use strict";

  function Component() {
    this.use = null;
  }

  function getComponent(data, name) {
    return data.components[name];// || (data.modules[name] = new infer.AVal);
  }

  function Module() {
    this.def = null;
    this.requires = null;
  }

  function getOrCreateModule(data, name) {
    var module = data.modules[name];
    if (!module) {
      module = new Module();
      data.modules[name] = module;
    }
    return module;
  }

  function getModule(data, name) {
    if (!data.initialized) {
      //infer.def.load(yuiOop);
      //infer.def.load(yuiEventAndNode);
      data.initialized = true;
    }
    return data.modules[name];// || (data.modules[name] = new infer.AVal);
  }

  function injectModule(Y, name) {
    var cx = infer.cx(), server = cx.parent, data = server._yui, module = getModule(data, name);
    if (module) {
      var def = module.def, requires = module.requires;
      if (def) {
        def.getType().propagate(Y);
      }
      if (requires) {
        for ( var i = 0; i < requires.length; i++) {
          var moduleName = requires[i];
          injectModule(Y, moduleName);
        }
      }
    } else {
      var component = getComponent(data, name);
      if (component && component.use) {
        for ( var i = 0; i < component.use.length; i++) {
          var moduleName = component.use[i];
          injectModule(Y, moduleName);
        }
      }
    }
  }

  function getFnIndex(argNodes) {
    for ( var i = 0; i < argNodes.length; i++) {
      if (argNodes[i].type == "FunctionExpression") {
        return i;
      }
    }
  }

  infer.registerFunction("yui_add", function(self, args, argNodes) {
    var yui = self.getType();
    if (yui && argNodes) {
      var index = getFnIndex(argNodes);
      if (index) {
        var fn = args[index];
        if (fn.argNames  && fn.argNames.length > 0) {
          var Y = fn.args[0];
          yui.getProp("prototype").getType().propagate(Y);
        }
      }
    }
  });

  infer.registerFunction("yui_use", function(self, args, argNodes) {
    var yui = self.getType();
    if (yui && argNodes) {
      var index = getFnIndex(argNodes);
      if (index) {
        var fn = args[index];
        if (fn.argNames  && fn.argNames.length > 0) {
          var Y = fn.args[0];
          Y.getType = function(guess) {
              if (this.types.length == 0 && guess !== false) return this.makeupType();
              if (this.types.length == 1) return this.types[0];
              return this;
          }
          yui.propagate(Y);

          var cx = infer.cx(), defs = cx.definitions["yui"];
          for ( var name in defs) {
              defs[name].getType().propagate(Y);
          }

          for ( var i = 0; i < argNodes.length - 1; i++) {
            var node = argNodes[i];
            if (node.type == "Literal" && typeof node.value == "string") {
              injectModule(Y, node.value);
            } else if (node.type == "ArrayExpression") for (var i = 0; i < node.elements.length; ++i) {
              var elt = node.elements[i];
              if (elt.type == "Literal" && typeof elt.value == "string") {
                injectModule(Y, elt.value);
              }
            }
          }
        }
      }
    }
  });

  function preCondenseReach(state) {

  }

  function postLoadDef(json) {
    var cx = infer.cx(), defName = json["!name"], defs = cx.definitions[defName], server = cx.parent, _yui = server._yui, yuiModule = defName && defName.slice(0, 'yui-'.length) == 'yui-';
    if (defs && yuiModule) for (var name in defs) {
      var obj = defs[name].getType();
      if (obj.metaData) {
        // it's a component
        var metaData = obj.metaData, componentName = null;
        for ( componentName in metaData) {
          var c = metaData[componentName];
          for(var prop in c) {
            switch(prop) {
            case 'plugins':
              break;
            case 'submodules':
              var submodules = c[prop];
              for ( var submoduleName in submodules) {
                var submodule = submodules[submoduleName];
                var module = getOrCreateModule(_yui, submoduleName);
                module.requires = submodule.requires;
              }
              break;
            case 'use':
              var component = new Component();
              component.use = c[prop];
              _yui.components[componentName] = component;
              break;
            }
          }
        }
      } else {
        // it's a module
        var moduleName = name.replace(/_/g, '-')
        var module = getOrCreateModule(_yui, moduleName);
        module.def = obj;
      }
    }
  }

  tern.registerPlugin("aui", function(server, options) {
    server._yui = {
        components: Object.create(null),
        modules: Object.create(null)
    };

    server.on("reset", function() {
      this._yui.initialized = false;
      this._yui.modules = Object.create(null);
    });

    return {
      defs: defs,
      passes: {
        preCondenseReach: preCondenseReach,
        postLoadDef: postLoadDef
      },
    };
  });

  var defs = {
 "!name": "aui",
 "!define": {
  "aui_ace_editor": {
   "A.AceEditor.AutoCompleteBase": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor.AutoCompleteBase",
    "!doc": "A base class for AutoCompleteBase.",
    "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html",
    "FILL_MODE_INSERT": {
     "!type": "?",
     "!doc": "Exposes a constant for insert fill mode. See `fillMode` for more information.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#property_FILL_MODE_INSERT"
    },
    "FILL_MODE_OVERWRITE": {
     "!type": "?",
     "!doc": "Exposes a constant for overwrite fill mode. See `fillMode` for more\ninformation.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#property_FILL_MODE_OVERWRITE"
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for AutoCompleteBase.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#property_ATTRS"
    },
    "prototype": {
     "fillMode": {
      "!type": "fn()",
      "!doc": "The mode in which the AutoComplete should operate. Can be one of these:\nINSERT - value '0' or OVERWRITE - value '1'. In case of INSERT mode, when\nEditor adds a suggestion, it will be added next to the matched\nexpression. In case of OVERWRITE mode, the suggestion will overwrite the\nmatched expression.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#attribute_fillMode"
     },
     "filters": {
      "!type": "fn()",
      "!doc": "Provides an array of filter functions which will filter the results. By\ndefault there is one function which provides phrase match filtering.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#attribute_filters"
     },
     "processor": {
      "!type": "fn()",
      "!doc": "The default processor which will be used to process matches.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#attribute_processor"
     },
     "showListKey": {
      "!type": "fn()",
      "!doc": "The keyboard combination which should be used to show the list with found\nresults.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#attribute_showListKey"
     },
     "sorters": {
      "!type": "fn()",
      "!doc": "Provides an array of sorter functions which will sort the results. By\ndefault there is one function which sorts the results in ascending order.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteBase.html#attribute_sorters"
     }
    }
   },
   "A.AceEditor.AutoCompleteFreemarker": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor.AutoCompleteFreemarker",
    "!proto": "aui_ace_editor.A.AceEditor.TemplateProcessor",
    "!doc": "A base class for Freemarker plugin.",
    "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html",
    "prototype": {
     "getMatch": {
      "!type": "fn(content: string) -> +Object",
      "!doc": "Checks if the provided content contains directive or variable.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#method_getMatch"
     },
     "directives": {
      "!type": "fn()",
      "!doc": "Contains the list of supported directives according to Freemarker\nspecification.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#attribute_directives"
     },
     "directivesMatcher": {
      "!type": "fn()",
      "!doc": "Contains the regular expression which checks for directive\npresence.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#attribute_directivesMatcher"
     },
     "host": {
      "!type": "fn()",
      "!doc": "The Editor in which the current instance is plugged.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#attribute_host"
     },
     "variables": {
      "!type": "fn()",
      "!doc": "Contains the supported variables.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#attribute_variables"
     },
     "variablesMatcher": {
      "!type": "fn()",
      "!doc": "Contains the regular expression which will check for variable\nmatch.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#attribute_variablesMatcher"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Freemarker.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteFreemarker.html#property_ATTRS"
    }
   },
   "A.AceEditor.AutoCompleteList": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor.AutoCompleteList",
    "!proto": "Overlay",
    "!doc": "A base class for AutoCompleteList.",
    "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the AutoCompleteList.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#property_ATTRS"
    },
    "prototype": {
     "host": {
      "!type": "fn()",
      "!doc": "The Editor in which the current instance is plugged.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_host"
     },
     "listNode": {
      "!type": "fn()",
      "!doc": "A Node in which results will be shown.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_listNode"
     },
     "loadingMessage": {
      "!type": "fn()",
      "!doc": "A string, representing the loading message.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_loadingMessage"
     },
     "results": {
      "!type": "fn()",
      "!doc": "Contains the current set of results in the list.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_results"
     },
     "selectedEntry": {
      "!type": "fn()",
      "!doc": "Provides the currently selected entry.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_selectedEntry"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#attribute_strings"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "The prefix of all CSS Classes.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#property_CSS_PREFIX"
    },
    "HTML_PARSER": {
     "!type": "?",
     "!doc": "Object hash, defining how attribute values are to be parsed from\nmarkup contained in the widget's content box.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteList.html#property_HTML_PARSER"
    }
   },
   "A.AceEditor.TemplateProcessor": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor.TemplateProcessor",
    "!proto": "Base",
    "!doc": "A base class for TemplateProcessor.",
    "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html",
    "prototype": {
     "getResults": {
      "!type": "fn(match: Object, callbackSuccess: fn(), callbackError: fn())",
      "!doc": "Accepts match and depending on its type processes directives or\nvariables. In case of success, calls the provided success callback,\nor the error callback otherwise.",
      "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#method_getResults"
     },
     "getSuggestion": {
      "!type": "fn(match: Object, selectedSuggestion: string) -> string",
      "!doc": "Formats the selected suggestion depending on the match type and\ncurrently selected editor mode. The match type can be one of:\nMATCH_DIRECTOVES or MATCH_VARIABLES. The selected editor mode can be\none of the following: INSERT or OVERWRITE. See {{#crossLink\n\"AceEditor.AutoCompleteBase/fillMode:attribute\"}}{{/crossLink}}",
      "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#method_getSuggestion"
     },
     "directives": {
      "!type": "fn()",
      "!doc": "Contains an array of all possible directives for the\ncorresponding language.",
      "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#attribute_directives"
     },
     "host": {
      "!type": "fn()",
      "!doc": "The Editor in which the current instance is plugged.",
      "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#attribute_host"
     },
     "variables": {
      "!type": "fn()",
      "!doc": "Contains the supported variables for the corresponding language.",
      "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#attribute_variables"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TemplateProcessor.",
     "!url": "http://alloyui.com/classes/A.AceEditor.TemplateProcessor.html#property_ATTRS"
    }
   },
   "A.AceEditor.AutoCompleteVelocity": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor.AutoCompleteVelocity",
    "!proto": "aui_ace_editor.A.AceEditor.TemplateProcessor",
    "!doc": "A base class for Velocity plugin.",
    "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html",
    "prototype": {
     "getMatch": {
      "!type": "fn(content: string) -> +Object",
      "!doc": "Checks if the provided content contains directive or variable.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#method_getMatch"
     },
     "directives": {
      "!type": "fn()",
      "!doc": "Contains the list of supported directives according to Velocity\nspecification.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#attribute_directives"
     },
     "directivesMatcher": {
      "!type": "fn()",
      "!doc": "Contains the regular expression which checks for directive.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#attribute_directivesMatcher"
     },
     "host": {
      "!type": "fn()",
      "!doc": "The Editor in which the current instance is plugged.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#attribute_host"
     },
     "variables": {
      "!type": "fn()",
      "!doc": "Contains the supported variables.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#attribute_variables"
     },
     "variablesMatcher": {
      "!type": "fn()",
      "!doc": "Contains the regular expression which will check for variable\nmatch.",
      "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#attribute_variablesMatcher"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property which provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Velocity.",
     "!url": "http://alloyui.com/classes/A.AceEditor.AutoCompleteVelocity.html#property_ATTRS"
    }
   },
   "A.AceEditor": {
    "!type": "fn(config: Object) -> +aui_ace_editor.A.AceEditor",
    "!proto": "Widget",
    "!doc": "A base class for ACE Editor.\n\nCheck the [live demo](http://alloyui.com/examples/ace-editor/).",
    "!url": "http://alloyui.com/classes/A.AceEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AceEditor.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.AceEditor.html#property_EXTENDS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the ACE Editor.",
     "!url": "http://alloyui.com/classes/A.AceEditor.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of ACE Editor.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_height"
     },
     "highlightActiveLine": {
      "!type": "fn()",
      "!doc": "Determine if the active line of code\nwill be highlighted or not.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_highlightActiveLine"
     },
     "mode": {
      "!type": "fn()",
      "!doc": "Correspond to the language being typed.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_mode"
     },
     "readOnly": {
      "!type": "fn()",
      "!doc": "Determine if the code will be\neditable or not.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_readOnly"
     },
     "showPrintMargin": {
      "!type": "fn()",
      "!doc": "Determine if print margin will\nbe visible or not.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_showPrintMargin"
     },
     "tabSize": {
      "!type": "fn()",
      "!doc": "The indentation size of tab key.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_tabSize"
     },
     "useSoftTabs": {
      "!type": "fn()",
      "!doc": "Determine if the tab key will act as\nspace characters or tab characters.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_useSoftTabs"
     },
     "useWrapMode": {
      "!type": "fn()",
      "!doc": "Determine if the line will break\nwhen it reaches the end of the line.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_useWrapMode"
     },
     "value": {
      "!type": "fn()",
      "!doc": "Some predefined value on the editor.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_value"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of ACE Editor.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#attribute_width"
     },
     "getEditor": {
      "!type": "fn()",
      "!doc": "Get editor.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#method_getEditor"
     },
     "getSelection": {
      "!type": "fn()",
      "!doc": "Get a text selection.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#method_getSelection"
     },
     "getSession": {
      "!type": "fn()",
      "!doc": "Get session.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#method_getSession"
     },
     "gotoLine": {
      "!type": "fn(line)",
      "!doc": "Go to a specific line of code.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#method_gotoLine"
     },
     "insert": {
      "!type": "fn(text)",
      "!doc": "Insert content into the editor.",
      "!url": "http://alloyui.com/classes/A.AceEditor.html#method_insert"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.AceEditor.html#property_UI_ATTRS"
    }
   }
  },
  "aui_affix": {
   "A.Affix": {
    "!type": "fn(config: Object) -> +aui_affix.A.Affix",
    "!proto": "Base",
    "!doc": "A base class for Affix.\n\nCheck the [live demo](http://alloyui.com/examples/affix/).",
    "!url": "http://alloyui.com/classes/A.Affix.html",
    "prototype": {
     "refresh": {
      "!type": "fn()",
      "!doc": "Refreshes the affix component to its current state.",
      "!url": "http://alloyui.com/classes/A.Affix.html#method_refresh"
     },
     "_validateOffset": {
      "!type": "fn(val: fn())",
      "!doc": "Validate the offset type.",
      "!url": "http://alloyui.com/classes/A.Affix.html#method__validateOffset"
     },
     "offsetBottom": {
      "!type": "fn()",
      "!doc": "Defines the bottom offset.",
      "!url": "http://alloyui.com/classes/A.Affix.html#attribute_offsetBottom"
     },
     "offsetTop": {
      "!type": "fn()",
      "!doc": "Defines the top offset.",
      "!url": "http://alloyui.com/classes/A.Affix.html#attribute_offsetTop"
     },
     "target": {
      "!type": "fn()",
      "!doc": "Defines the target element.",
      "!url": "http://alloyui.com/classes/A.Affix.html#attribute_target"
     },
     "undefined": {
      "!type": "fn()",
      "!doc": "Map of class names containing `BOTTOM`, `DEFAULT` or `TOP` keys.",
      "!url": "http://alloyui.com/classes/A.Affix.html"
     }
    }
   }
  },
  "aui_alert": {
   "A.Alert": {
    "!type": "fn(config: Object) -> +aui_alert.A.Alert",
    "!proto": "Widget",
    "!doc": "A base class for Alert.\n\nCheck the [live demo](http://alloyui.com/examples/alert/).",
    "!url": "http://alloyui.com/classes/A.Alert.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Alert.",
     "!url": "http://alloyui.com/classes/A.Alert.html#property_ATTRS"
    },
    "prototype": {
     "closeable": {
      "!type": "fn()",
      "!doc": "Whether the alert can be closed.",
      "!url": "http://alloyui.com/classes/A.Alert.html#attribute_closeable"
     },
     "closeableNode": {
      "!type": "fn()",
      "!doc": "Node used to generate a close button.",
      "!url": "http://alloyui.com/classes/A.Alert.html#attribute_closeableNode"
     },
     "popoverCssClass": {
      "!type": "fn()",
      "!doc": "CSS class for alert.",
      "!url": "http://alloyui.com/classes/A.Alert.html#attribute_popoverCssClass"
     },
     "destroyOnHide": {
      "!type": "fn()",
      "!doc": "Determine if Alert should be destroyed when hidden.",
      "!url": "http://alloyui.com/classes/A.Alert.html#attribute_destroyOnHide"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Alert.html#property_CSS_PREFIX"
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how closeableNode value have to be parsed from markup.",
     "!url": "http://alloyui.com/classes/A.Alert.html#property_HTML_PARSER"
    }
   },
   "A.Plugin.Aria": {
    "!type": "fn(config: Object) -> +aui_aria.A.Plugin.Aria",
    "!proto": "Plugin.Base",
    "!doc": "A base class for Aria.",
    "!url": "http://alloyui.com/classes/A.Plugin.Aria.html",
    "W3C_ATTRIBUTES": {
     "!type": "+Object",
     "!doc": "Static property used to define [W3C's Supported States and\nProperties](http://www.w3.org/TR/wai-aria/states_and_properties).",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_W3C_ATTRIBUTES"
    },
    "W3C_ROLES": {
     "!type": "+Object",
     "!doc": "Static property used to define [W3C's Roles Model](http://www.w3.org/TR/wai-\naria/roles).",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_W3C_ROLES"
    }
   }
  },
  "aui_aria": {
   "A.Plugin.Aria": {
    "!type": "fn(config: Object) -> +aui_aria.A.Plugin.Aria",
    "!proto": "Plugin.Base",
    "!doc": "A base class for Aria.",
    "!url": "http://alloyui.com/classes/A.Plugin.Aria.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for\nthe `A.Aria`.",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_ATTRS"
    },
    "prototype": {
     "attributes": {
      "!type": "fn()",
      "!doc": "The ARIA attributes collection.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_attributes"
     },
     "attributeValueFormat": {
      "!type": "fn()",
      "!doc": "The ARIA attribute value format.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_attributeValueFormat"
     },
     "attributeNode": {
      "!type": "fn()",
      "!doc": "Node container for the ARIA attribute.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_attributeNode"
     },
     "roleName": {
      "!type": "fn()",
      "!doc": "The ARIA role name.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_roleName"
     },
     "roleNode": {
      "!type": "fn()",
      "!doc": "Node container for the ARIA role.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_roleNode"
     },
     "validateW3C": {
      "!type": "fn()",
      "!doc": "Checks if the attribute is valid with W3C rules.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#attribute_validateW3C"
     },
     "isValidAttribute": {
      "!type": "fn(attrName) -> bool",
      "!doc": "Checks if the ARIA attribute is valid.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_isValidAttribute"
     },
     "isValidRole": {
      "!type": "fn(roleName) -> bool",
      "!doc": "Checks if the ARIA role is valid.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_isValidRole"
     },
     "setAttribute": {
      "!type": "fn(attrName, attrValue, node) -> bool",
      "!doc": "Set a single ARIA attribute.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_setAttribute"
     },
     "setAttributes": {
      "!type": "fn(attributes)",
      "!doc": "Set a list of ARIA attributes.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_setAttributes"
     },
     "setRole": {
      "!type": "fn(roleName, node) -> bool",
      "!doc": "Set a single ARIA role.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_setRole"
     },
     "setRoles": {
      "!type": "fn(roles)",
      "!doc": "Set a list of ARIA roles.",
      "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#method_setRoles"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.Plugin.Aria.html#property_EXTENDS"
    }
   }
  },
  "aui_arraysort": {
   "A.ArraySort": {
    "!type": "fn() -> +aui_arraysort.A.ArraySort",
    "!doc": "Augment the [YUI3 ArraySort](ArraySort.html) with more util methods.",
    "!url": "http://alloyui.com/classes/A.ArraySort.html",
    "prototype": {
     "compareIgnoreWhiteSpace": {
      "!type": "fn(a, b, desc, compareFn) -> ?",
      "!doc": "Compare two arrays ignoring white spaces.",
      "!url": "http://alloyui.com/classes/A.ArraySort.html#method_compareIgnoreWhiteSpace"
     },
     "stableSort": {
      "!type": "fn(array, compareFn)",
      "!doc": "Sorts an object array keeping the order of equal items. ECMA script\nstandard does not specify the behaviour when the compare function\nreturns the value 0;",
      "!url": "http://alloyui.com/classes/A.ArraySort.html#method_stableSort"
     }
    }
   }
  },
  "aui_audio": {
   "A.Audio": {
    "!type": "fn(config: Object) -> +aui_audio.A.Audio",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Audio.\n\nCheck the [live demo](http://alloyui.com/examples/audio/).",
    "!url": "http://alloyui.com/classes/A.Audio.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Audio.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Audio.",
     "!url": "http://alloyui.com/classes/A.Audio.html#property_ATTRS"
    },
    "prototype": {
     "flashVars": {
      "!type": "fn()",
      "!doc": "Variables used by Flash player.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_flashVars"
     },
     "fixedAttributes": {
      "!type": "fn()",
      "!doc": "An additional list of attributes.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_fixedAttributes"
     },
     "oggUrl": {
      "!type": "fn()",
      "!doc": "URL (on .ogg format) used by Audio to play.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_oggUrl"
     },
     "render": {
      "!type": "fn()",
      "!doc": "If `true` the render phase will be automatically invoked\npreventing the `.render()` manual call.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_render"
     },
     "role": {
      "!type": "fn()",
      "!doc": "Sets the `aria-role` for Audio.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_role"
     },
     "swfWidth": {
      "!type": "fn()",
      "!doc": "The width of Audio's fallback using Flash.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_swfWidth"
     },
     "swfHeight": {
      "!type": "fn()",
      "!doc": "The height of Audio's fallback using Flash.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_swfHeight"
     },
     "swfUrl": {
      "!type": "fn()",
      "!doc": "URL (on .swf format) used by Audio to create\na fallback player with Flash.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_swfUrl"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of audio.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_type"
     },
     "url": {
      "!type": "fn()",
      "!doc": "URL used by Audio to play.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_url"
     },
     "useARIA": {
      "!type": "fn()",
      "!doc": "Boolean indicating if use of the WAI-ARIA Roles and States\nshould be enabled.",
      "!url": "http://alloyui.com/classes/A.Audio.html#attribute_useARIA"
     },
     "load": {
      "!type": "fn()",
      "!doc": "Load audio track.",
      "!url": "http://alloyui.com/classes/A.Audio.html#method_load"
     },
     "pause": {
      "!type": "fn()",
      "!doc": "Pause audio track.",
      "!url": "http://alloyui.com/classes/A.Audio.html#method_pause"
     },
     "play": {
      "!type": "fn()",
      "!doc": "Play audio track.",
      "!url": "http://alloyui.com/classes/A.Audio.html#method_play"
     }
    },
    "BIND_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes\nfor the bindUI lifecycle phase.",
     "!url": "http://alloyui.com/classes/A.Audio.html#property_BIND_UI_ATTRS"
    },
    "SYNC_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes\nfor the syncUI lifecycle phase.",
     "!url": "http://alloyui.com/classes/A.Audio.html#property_SYNC_UI_ATTRS"
    }
   }
  },
  "aui_autosize_iframe": {
   "A.AutosizeIframe": {
    "!type": "fn(config: Object) -> +aui_autosize_iframe.A.AutosizeIframe",
    "!proto": "Plugin.Base",
    "!doc": "A base class for `A.AutosizeIframe`.",
    "!url": "http://alloyui.com/classes/A.AutosizeIframe.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#property_NS"
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#property_EXTENDS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.AutosizeIframe`.",
     "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the iframe.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#attribute_height"
     },
     "monitorHeight": {
      "!type": "fn()",
      "!doc": "Indicates if the height should be monitored.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#attribute_monitorHeight"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the iframe.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#attribute_width"
     },
     "pauseMonitor": {
      "!type": "fn()",
      "!doc": "Stops to monitor the height.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#method_pauseMonitor"
     },
     "restartMonitor": {
      "!type": "fn()",
      "!doc": "Restarts to monitor the height.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#method_restartMonitor"
     },
     "getContentHeight": {
      "!type": "fn(iframeWin) -> number",
      "!doc": "Returns the content height of a window.",
      "!url": "http://alloyui.com/classes/A.AutosizeIframe.html#method_getContentHeight"
     }
    }
   }
  },
  "aui_button": {
   "A.ButtonExt": {
    "!type": "fn(config: Object) -> +aui_button.A.ButtonExt",
    "!doc": "A base class for `ButtonExt`.",
    "!url": "http://alloyui.com/classes/A.ButtonExt.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Defines the default attribute configuration for the `ButtonExt`.",
     "!url": "http://alloyui.com/classes/A.ButtonExt.html#property_ATTRS"
    },
    "prototype": {
     "cssClass": {
      "!type": "fn()",
      "!doc": "CSS class to be automatically added to the `boundingBox`.",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#attribute_cssClass"
     },
     "domType": {
      "!type": "fn()",
      "!doc": "Defines the HTML type attribute of element e.g. `<input type=\"button\">`.",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#attribute_domType"
     },
     "icon": {
      "!type": "fn()",
      "!doc": "Contains a CSS class of the icon to use. A list of icons can be found\n[here](http://liferay.github.io/alloy-bootstrap/base-css.html#icons).",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#attribute_icon"
     },
     "iconElement": {
      "!type": "fn()",
      "!doc": "Defines markup template for icon, passed in as a node e.g.\n`Y.Node.create('<span></span>')`.",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#attribute_iconElement"
     },
     "iconAlign": {
      "!type": "fn()",
      "!doc": "Sets position of icon.",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#attribute_iconAlign"
     },
     "syncButtonExtUI": {
      "!type": "fn()",
      "!doc": "Updates icon CSS class.",
      "!url": "http://alloyui.com/classes/A.ButtonExt.html#method_syncButtonExtUI"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Defines how attribute values are to be parsed from markup contained in\n`ButtonExt`.",
     "!url": "http://alloyui.com/classes/A.ButtonExt.html#property_HTML_PARSER"
    },
    "getTypedButtonTemplate": {
     "!type": "fn(template: string, type: string) -> string",
     "!doc": "Updates the HTML markup specified as the `template` argument with the\npassed `type`.",
     "!url": "http://alloyui.com/classes/A.ButtonExt.html#method_getTypedButtonTemplate"
    }
   },
   "A.ButtonCore": {
    "!type": "fn() -> +aui_button.A.ButtonCore",
    "!doc": "A base class for ButtonCore.",
    "!url": "http://alloyui.com/classes/A.ButtonCore.html",
    "CLASS_NAMES": {
     "!type": "?",
     "!doc": "Contains CSS class names to use for `ButtonCore`.",
     "!url": "http://alloyui.com/classes/A.ButtonCore.html#property_CLASS_NAMES"
    }
   },
   "A.Button": {
    "!type": "fn() -> +aui_button.A.Button",
    "!proto": "Button",
    "!doc": "A base class for Button.",
    "!url": "http://alloyui.com/classes/A.Button.html",
    "prototype": {
     "getWidgetLazyConstructorFromNodeData": {
      "!type": "fn(node: aui_node.Node) -> +Object",
      "!doc": "Returns an object literal containing widget constructor data specified in\nthe node.",
      "!url": "http://alloyui.com/classes/A.Button.html#method_getWidgetLazyConstructorFromNodeData"
     },
     "hasWidgetLazyConstructorData": {
      "!type": "fn(node: aui_node.Node) -> bool",
      "!doc": "Returns a boolean, true if node has widget constructor data.",
      "!url": "http://alloyui.com/classes/A.Button.html#method_hasWidgetLazyConstructorData"
     },
     "setWidgetLazyConstructorNodeData": {
      "!type": "fn(node: aui_node.Node, config: Object)",
      "!doc": "Updates node's widget constructor data attribute with config.",
      "!url": "http://alloyui.com/classes/A.Button.html#method_setWidgetLazyConstructorNodeData"
     },
     "syncIconUI": {
      "!type": "fn(buttonElement: aui_node.Node, iconElement: aui_node.Node, iconAlign: string)",
      "!doc": "Updates icon alignment in button.",
      "!url": "http://alloyui.com/classes/A.Button.html#method_syncIconUI"
     }
    }
   },
   "A.ButtonGroup": {
    "!type": "fn() -> +aui_button.A.ButtonGroup",
    "!doc": "A base class for ButtonGroup.",
    "!url": "http://alloyui.com/classes/A.ButtonGroup.html",
    "prototype": {
     "item": {
      "!type": "fn(index: number) -> +Button",
      "!doc": "Returns the `item` or `node` of specified `index`.",
      "!url": "http://alloyui.com/classes/A.ButtonGroup.html#method_item"
     },
     "select": {
      "!type": "fn(items: Array)",
      "!doc": "Selects items by adding the active class name.",
      "!url": "http://alloyui.com/classes/A.ButtonGroup.html#method_select"
     },
     "toggleSelect": {
      "!type": "fn(items: Array, forceSelection: bool)",
      "!doc": "Toggles selection by adding or removing the active class name.",
      "!url": "http://alloyui.com/classes/A.ButtonGroup.html#method_toggleSelect"
     },
     "unselect": {
      "!type": "fn(items: Array)",
      "!doc": "Selects items by adding the active class name.",
      "!url": "http://alloyui.com/classes/A.ButtonGroup.html#method_unselect"
     }
    }
   },
   "A.ButtonSearchCancel": {
    "!type": "fn(config: Object) -> +aui_button.A.ButtonSearchCancel",
    "!proto": "Base",
    "!doc": "A base class for `ButtonSearchCancel`, providing:\n\n- Adds a button search cancel icon in order to clear the text on inputs and\ntextareas. Similar behavior of the HTML5 search input that contains a cancel\nbutton to clear the current element value.",
    "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html",
    "prototype": {
     "initializer": {
      "!type": "fn()",
      "!doc": "Construction logic executed during `ButtonSearchCancel` instantiation.\nLifecycle.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#method_initializer"
     },
     "bindUI": {
      "!type": "fn()",
      "!doc": "Bind events on the UI. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#method_bindUI"
     },
     "getButtonForElement": {
      "!type": "fn(element: aui_node.Node) -> +aui_node.Node",
      "!doc": "Delegates events on the UI. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#method_getButtonForElement"
     },
     "container": {
      "!type": "fn()",
      "!doc": "Defines the event delegation container of `ButtonSearchCancel`\ninstance.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_container"
     },
     "gutter": {
      "!type": "fn()",
      "!doc": "Defines the space surrounding the cancel icon rendered on the input.\nUseful when the user needs a different alignment. Gutter values are\nadded to the X and Y alignment values of the button search cancel.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_gutter"
     },
     "iconClass": {
      "!type": "fn()",
      "!doc": "Icon CSS class to be used on the search cancel button.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_iconClass"
     },
     "iconWidth": {
      "!type": "fn()",
      "!doc": "Defines the width of the button. Useful when an async request\nfor resource file (image or font for example) may be necessary\nbefore calculating the button's width.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_iconWidth"
     },
     "iconHeight": {
      "!type": "fn()",
      "!doc": "Defines the height of the button. Useful when an async request\nfor resource file (image or font for example) may be necessary\nbefore calculating the button's height.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_iconHeight"
     },
     "trigger": {
      "!type": "fn()",
      "!doc": "Defines the CSS selector for the input elements the button search\ncancel renders. Supports single or multiple node selector.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_trigger"
     },
     "zIndex": {
      "!type": "fn()",
      "!doc": "Defines the z-index of the button search cancel.",
      "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#attribute_zIndex"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for\nthe `ButtonSearchCancel`.",
     "!url": "http://alloyui.com/classes/A.ButtonSearchCancel.html#property_ATTRS"
    }
   }
  },
  "aui_carousel_touch": {
   "A.Carousel": {
    "!type": "fn(config: Object) -> +aui_carousel.A.Carousel",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Carousel.\n\nCheck the [live demo](http://alloyui.com/examples/carousel/).",
    "!url": "http://alloyui.com/classes/A.Carousel.html",
    "prototype": {
     "nodeMenuPosition": {
      "!type": "fn()",
      "!doc": "Position of the menu.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_nodeMenuPosition"
     }
    }
   }
  },
  "aui_carousel": {
   "A.Carousel": {
    "!type": "fn(config: Object) -> +aui_carousel.A.Carousel",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Carousel.\n\nCheck the [live demo](http://alloyui.com/examples/carousel/).",
    "!url": "http://alloyui.com/classes/A.Carousel.html",
    "prototype": {
     "item": {
      "!type": "fn(val: number)",
      "!doc": "Set the `currentIndex` attribute which\nactivates a certain item on `A.Carousel` based on its index.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#method_item"
     },
     "_isMouseInsideMenu": {
      "!type": "fn(event: EventFacade) -> bool",
      "!doc": "Checks if the mouse is inside the menu region.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#method__isMouseInsideMenu"
     },
     "circular": {
      "!type": "fn()",
      "!doc": "If the carousel will be circular or not.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_circular"
     },
     "controlNext": {
      "!type": "fn()",
      "!doc": "The node for the control that shows the next image.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_controlNext"
     },
     "controlPrevious": {
      "!type": "fn()",
      "!doc": "The node for the control that shows the previous image.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_controlPrevious"
     },
     "nodeMenu": {
      "!type": "fn()",
      "!doc": "Node container of the navigation items.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_nodeMenu"
     },
     "nodeMenuItemSelector": {
      "!type": "fn()",
      "!doc": "CSS selector to match the navigation items.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_nodeMenuItemSelector"
     },
     "nodeMenuPosition": {
      "!type": "fn()",
      "!doc": "Position of the menu.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_nodeMenuPosition"
     },
     "pauseOnHover": {
      "!type": "fn()",
      "!doc": "Determines if `A.Carousel` will pause on mouse enter or play when\nmouse leave.",
      "!url": "http://alloyui.com/classes/A.Carousel.html#attribute_pauseOnHover"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.Carousel`.",
     "!url": "http://alloyui.com/classes/A.Carousel.html#property_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Carousel.html#property_CSS_PREFIX"
    }
   }
  },
  "aui_char_counter": {
   "A.CharCounter": {
    "!type": "fn(config: Object) -> +aui_char_counter.A.CharCounter",
    "!proto": "Base",
    "!doc": "A base class for CharCounter, providing:\n\n- Limit the number of characters allowed in an input box\n- Display the number of characters left\n\nCheck the [live demo](http://alloyui.com/examples/char-counter/).",
    "!url": "http://alloyui.com/classes/A.CharCounter.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.CharCounter.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the CharCounter.",
     "!url": "http://alloyui.com/classes/A.CharCounter.html#property_ATTRS"
    },
    "prototype": {
     "counter": {
      "!type": "fn()",
      "!doc": "Node or Selector to display the information of the counter.",
      "!url": "http://alloyui.com/classes/A.CharCounter.html#attribute_counter"
     },
     "maxLength": {
      "!type": "fn()",
      "!doc": "Max number of characters the [input](A.CharCounter.html#attr_input)\ncan have.",
      "!url": "http://alloyui.com/classes/A.CharCounter.html#attribute_maxLength"
     },
     "input": {
      "!type": "fn()",
      "!doc": "Node or Selector for the input field. Required.",
      "!url": "http://alloyui.com/classes/A.CharCounter.html#attribute_input"
     },
     "checkLength": {
      "!type": "fn()",
      "!doc": "Check the current value of the\n[input](A.CharCounter.html#attr_input), truncate the data if needed,\nand re-sync the UI. Fired from\n[_onInputChange](A.CharCounter.html#method__onInputChange).",
      "!url": "http://alloyui.com/classes/A.CharCounter.html#method_checkLength"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.CharCounter.html#property_EXTENDS"
    }
   },
   "A.LinkedSet": {
    "!type": "fn(config: Object) -> +aui_collection.A.LinkedSet",
    "!proto": "A.Set",
    "!doc": "A base class for LinkedSet.",
    "!url": "http://alloyui.com/classes/A.LinkedSet.html",
    "prototype": {
     "undefined": {
      "!type": "fn()",
      "!doc": "Changes the test input's content and manually triggers the\n'input' event on it.",
      "!url": "http://alloyui.com/classes/A.LinkedSet.html"
     }
    }
   }
  },
  "aui_collection": {
   "A.LinkedSet": {
    "!type": "fn(config: Object) -> +aui_collection.A.LinkedSet",
    "!proto": "A.Set",
    "!doc": "A base class for LinkedSet.",
    "!url": "http://alloyui.com/classes/A.LinkedSet.html",
    "prototype": {
     "values": {
      "!type": "fn() -> +Array",
      "!doc": "Gets a list view of the values contained in this linked set.",
      "!url": "http://alloyui.com/classes/A.LinkedSet.html#method_values"
     }
    }
   },
   "A.HashMap": {
    "!type": "fn(config: Object) -> +aui_collection.A.HashMap",
    "!proto": "Base",
    "!doc": "A base class for HashMap.",
    "!url": "http://alloyui.com/classes/A.HashMap.html",
    "prototype": {
     "clear": {
      "!type": "fn()",
      "!doc": "Fires the `clear` custom event.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_clear"
     },
     "getValue": {
      "!type": "fn(key) -> +Object",
      "!doc": "Returns the value from a key in this map.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_getValue"
     },
     "has": {
      "!type": "fn(key, opt_hash) -> bool",
      "!doc": "Checks if this map has the specified key.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_has"
     },
     "hasValue": {
      "!type": "fn(value) -> bool",
      "!doc": "Returns `true` if this map contains a certain value.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_hasValue"
     },
     "keys": {
      "!type": "fn() -> +Object",
      "!doc": "Returns a collection of the keys contained in this map.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_keys"
     },
     "isEmpty": {
      "!type": "fn() -> bool",
      "!doc": "Returns `true` if this map contains no key-value mappings.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_isEmpty"
     },
     "put": {
      "!type": "fn(key, value, opt_hash)",
      "!doc": "Fires the `put` custom event.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_put"
     },
     "putAll": {
      "!type": "fn(map)",
      "!doc": "Copies all of the mappings from the specified map to this map.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_putAll"
     },
     "remove": {
      "!type": "fn(key, opt_hash) -> +Object",
      "!doc": "Fires the `remove` custom event.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_remove"
     },
     "size": {
      "!type": "fn() -> number",
      "!doc": "Returns the number of key-value mappings in this map.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_size"
     },
     "values": {
      "!type": "fn() -> +Object",
      "!doc": "Returns a collection of the values contained in this map.",
      "!url": "http://alloyui.com/classes/A.HashMap.html#method_values"
     }
    }
   },
   "A.HashSet": {
    "!type": "fn(config: Object) -> +aui_collection.A.HashSet",
    "!proto": "Base",
    "!doc": "A base class for HashSet.",
    "!url": "http://alloyui.com/classes/A.HashSet.html",
    "prototype": {
     "add": {
      "!type": "fn(value)",
      "!doc": "Fires the `add` custom event.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_add"
     },
     "clear": {
      "!type": "fn()",
      "!doc": "Fires the `clear` custom event.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_clear"
     },
     "has": {
      "!type": "fn(value, opt_hash) -> bool",
      "!doc": "Checks if this set has the specified key.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_has"
     },
     "isEmpty": {
      "!type": "fn()",
      "!doc": "Returns `true` if this set contains no elements.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_isEmpty"
     },
     "remove": {
      "!type": "fn(value)",
      "!doc": "Fires the `remove` custom event with an argument.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_remove"
     },
     "size": {
      "!type": "fn()",
      "!doc": "Get the size of the map.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_size"
     },
     "values": {
      "!type": "fn()",
      "!doc": "Get the keys of the map.",
      "!url": "http://alloyui.com/classes/A.HashSet.html#method_values"
     }
    }
   }
  },
  "aui_color_picker": {
   "A.ColorPalette": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.ColorPalette",
    "!proto": "Widget",
    "!doc": "A base class for `ColorPalette`.",
    "!url": "http://alloyui.com/classes/A.ColorPalette.html",
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.ColorPalette.html#property_CSS_PREFIX"
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ColorPalette.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `ColorPalette`.",
     "!url": "http://alloyui.com/classes/A.ColorPalette.html#property_ATTRS"
    },
    "prototype": {
     "items": {
      "!type": "fn()",
      "!doc": "Colors available to the `ColorPalette`.",
      "!url": "http://alloyui.com/classes/A.ColorPalette.html#attribute_items"
     }
    }
   },
   "A.ColorPickerBase": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.ColorPickerBase",
    "!doc": "A base class for `ColorPickerBase`.",
    "!url": "http://alloyui.com/classes/A.ColorPickerBase.html",
    "prototype": {
     "reset": {
      "!type": "fn()",
      "!doc": "Resets the `ColorPickerBase` to it's default state.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#method_reset"
     },
     "bodyContent": {
      "!type": "fn()",
      "!doc": "The content of body.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_bodyContent"
     },
     "color": {
      "!type": "fn()",
      "!doc": "Currently selected color.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_color"
     },
     "colorPalette": {
      "!type": "fn()",
      "!doc": "Default colors available to the color palette.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_colorPalette"
     },
     "currentTrigger": {
      "!type": "fn()",
      "!doc": "Current `trigger` node.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_currentTrigger"
     },
     "defaultColor": {
      "!type": "fn()",
      "!doc": "Provides the default color used for the `recentColors` palette.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_defaultColor"
     },
     "hsvPalette": {
      "!type": "fn()",
      "!doc": "`HSVPalette` used for selecting custom colors not present in\n`defualtColors`.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_hsvPalette"
     },
     "recentColors": {
      "!type": "fn()",
      "!doc": "Colors that have been selected recently from the `HSVPalette`.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_recentColors"
     },
     "renderColorPalette": {
      "!type": "fn()",
      "!doc": "Determines if the color palette is rendered on load.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_renderColorPalette"
     },
     "renderHSVPalette": {
      "!type": "fn()",
      "!doc": "Determines if the `HSVPalette` is rendered on load.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_renderHSVPalette"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_strings"
     },
     "trigger": {
      "!type": "fn()",
      "!doc": "Trigger node that opens the color palette.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_trigger"
     },
     "triggerEvent": {
      "!type": "fn()",
      "!doc": "Trigger event that fires on `trigger` click.",
      "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#attribute_triggerEvent"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `ColorPickerBase`.",
     "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#property_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#property_CSS_PREFIX"
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ColorPickerBase.html#property_NAME"
    }
   },
   "A.ColorPickerPopover": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.ColorPickerPopover",
    "!proto": "aui_popover.A.Popover",
    "!doc": "A base class for `ColorPickerPopover`.",
    "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `ColorPickerPopover`.",
     "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html#property_ATTRS"
    },
    "prototype": {
     "align": {
      "!type": "fn()",
      "!doc": "The alignment configuration for `ColorPickerPopover`.",
      "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html#attribute_align"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Determines if `ColorPickerPopover` is visible or not.",
      "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html#attribute_visible"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.ColorPickerPopover.html#property_NS"
    }
   },
   "A.HSVPalette": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.HSVPalette",
    "!proto": "Widget",
    "!doc": "A base class for `HSVPalette`.",
    "!url": "http://alloyui.com/classes/A.HSVPalette.html",
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.HSVPalette.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `HSVPalette`.",
     "!url": "http://alloyui.com/classes/A.HSVPalette.html#property_ATTRS"
    },
    "prototype": {
     "controls": {
      "!type": "fn()",
      "!doc": "Determines if HSVA and RGB input `controls` are visible.",
      "!url": "http://alloyui.com/classes/A.HSVPalette.html#attribute_controls"
     },
     "fieldValidator": {
      "!type": "fn()",
      "!doc": "Collection of regular expressions used to validate field values.",
      "!url": "http://alloyui.com/classes/A.HSVPalette.html#attribute_fieldValidator"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Currently `selected` color value.",
      "!url": "http://alloyui.com/classes/A.HSVPalette.html#attribute_selected"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.HSVPalette.html#attribute_strings"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.HSVPalette.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.HSVPalette.html#property_NS"
    }
   },
   "A.HSVAPaletteModal": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.HSVAPaletteModal",
    "!proto": "aui_modal.A.Modal",
    "!doc": "A base class for `HSVAPaletteModal`.",
    "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `HSVAPaletteModal`.",
     "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#property_ATTRS"
    },
    "prototype": {
     "hsv": {
      "!type": "fn()",
      "!doc": "Configuration options for the `HSVPalette`.",
      "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#attribute_hsv"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Currently `selected` color value.",
      "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#attribute_selected"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#property_CSS_PREFIX"
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.HSVAPaletteModal.html#property_NS"
    }
   },
   "A.HSVAPalette": {
    "!type": "fn(config: Object) -> +aui_color_picker.A.HSVAPalette",
    "!proto": "aui_color_picker.A.HSVPalette",
    "!doc": "A base class for `HSVAPalette`.",
    "!url": "http://alloyui.com/classes/A.HSVAPalette.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.HSVAPalette.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.HSVAPalette.html#property_NS"
    }
   }
  },
  "aui_component": {
   "A.Component": {
    "!type": "fn(config: Object) -> +aui_component.A.Component",
    "!proto": "Widget",
    "!doc": "A base class for `A.Component`, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)",
    "!url": "http://alloyui.com/classes/A.Component.html",
    "prototype": {
     "clone": {
      "!type": "fn(config: Object) -> +Widget",
      "!doc": "Clone the current `A.Component`.",
      "!url": "http://alloyui.com/classes/A.Component.html#method_clone"
     },
     "useARIA": {
      "!type": "fn()",
      "!doc": "Indicates if use of the WAI-ARIA Roles and States should be enabled\nfor the Widget.",
      "!url": "http://alloyui.com/classes/A.Component.html#attribute_useARIA"
     },
     "hideClass": {
      "!type": "fn()",
      "!doc": "CSS class added to hide the `boundingBox` when\n[visible](A.Component.html#attr_visible) is set to `false`.",
      "!url": "http://alloyui.com/classes/A.Component.html#attribute_hideClass"
     },
     "render": {
      "!type": "fn()",
      "!doc": "If `true` the render phase will be autimatically invoked preventing\nthe `.render()` manual call.",
      "!url": "http://alloyui.com/classes/A.Component.html#attribute_render"
     },
     "getById": {
      "!type": "fn(id)",
      "!doc": "Gets component's instance by id.",
      "!url": "http://alloyui.com/classes/A.Component.html#method_getById"
     },
     "create": {
      "!type": "fn(config)",
      "!doc": "Applies standard extensions from a given config to create a new class using\nthe static `Base.build` method.",
      "!url": "http://alloyui.com/classes/A.Component.html#method_create"
     },
     "build": {
      "!type": "fn()",
      "!doc": "Applies extensions to a class using the static `Base.build` method.",
      "!url": "http://alloyui.com/classes/A.Component.html#method_build"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for\nthe Component.",
     "!url": "http://alloyui.com/classes/A.Component.html#property_ATTRS"
    },
    "_INSTANCES": {
     "!type": "+Object",
     "!doc": "Static property used to define the map to store Component instances by id.",
     "!url": "http://alloyui.com/classes/A.Component.html#property__INSTANCES"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Component.html#property_CSS_PREFIX"
    }
   },
   "A.BaseCellEditor": {
    "!type": "fn(config: Object) -> +aui_component.A.BaseCellEditor",
    "!proto": "Overlay",
    "!doc": "Abstract class BaseCellEditor.",
    "!url": "http://alloyui.com/classes/A.BaseCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the BaseCellEditor.",
     "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#property_ATTRS"
    },
    "prototype": {
     "constrain": {
      "!type": "fn()",
      "!doc": "The node to constrain the widget's bounding box to, when setting xy.\nCan also be set to true, to constrain to the viewport.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_constrain"
     },
     "editable": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_editable"
     },
     "elementName": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_elementName"
     },
     "footerContent": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_footerContent"
     },
     "hideOnSave": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_hideOnSave"
     },
     "inputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_inputFormatter"
     },
     "outputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_outputFormatter"
     },
     "showToolbar": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_showToolbar"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_strings"
     },
     "tabIndex": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_tabIndex"
     },
     "toolbar": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_toolbar"
     },
     "unescapeValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_unescapeValue"
     },
     "validator": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_validator"
     },
     "value": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_value"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#attribute_visible"
     },
     "formatValue": {
      "!type": "fn(formatter, val)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#method_formatValue"
     },
     "getValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#method_getValue"
     },
     "getElementsValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.\n\nNOTE FOR DEVELOPERS: Yoy *may* want to replace the methods from\nthis section on your implementation.",
      "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#method_getElementsValue"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#property_EXTENDS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.BaseCellEditor.html#property_UI_ATTRS"
    }
   },
   "A.BaseOptionsCellEditor": {
    "!type": "fn(config: Object) -> +aui_component.A.BaseOptionsCellEditor",
    "!proto": "aui_component.A.BaseCellEditor",
    "!doc": "Abstract class BaseOptionsCellEditor for options attribute support.",
    "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the BaseOptionsCellEditor.",
     "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#property_ATTRS"
    },
    "prototype": {
     "inputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#attribute_inputFormatter"
     },
     "options": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#attribute_options"
     },
     "outputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#attribute_outputFormatter"
     },
     "selectedAttrName": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#attribute_selectedAttrName"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#attribute_strings"
     },
     "addNewOption": {
      "!type": "fn(name, value)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#method_addNewOption"
     },
     "removeOption": {
      "!type": "fn(optionRow)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#method_removeOption"
     },
     "saveOptions": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#method_saveOptions"
     },
     "toggleEdit": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#method_toggleEdit"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#property_EXTENDS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.BaseOptionsCellEditor.html#property_UI_ATTRS"
    }
   }
  },
  "aui_datatable": {
   "A.DataTableBody": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DataTableBody",
    "!doc": "An extension for A.DataTable.BodyView that adds correct class to Table.",
    "!url": "http://alloyui.com/classes/A.DataTableBody.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DataTableBody.html#property_NAME"
    }
   },
   "A.DataTable.CellEditorSupport": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DataTable.CellEditorSupport",
    "!doc": "An extension for A.DataTable to support Cell Editing.",
    "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#property_NAME"
    },
    "EDITOR_ZINDEX": {
     "!type": "number",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#property_EDITOR_ZINDEX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the CellEditorSupport.",
     "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#property_ATTRS"
    },
    "prototype": {
     "editEvent": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#attribute_editEvent"
     },
     "getEditor": {
      "!type": "fn(record, column)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#method_getEditor"
     },
     "getCellEditor": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#method_getCellEditor"
     },
     "getRecordColumnValue": {
      "!type": "fn(record, column)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTable.CellEditorSupport.html#method_getRecordColumnValue"
     }
    }
   },
   "A.CheckboxCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.CheckboxCellEditor",
    "!proto": "aui_component.A.BaseOptionsCellEditor",
    "!doc": "CheckboxCellEditor class.",
    "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the CheckboxCellEditor.",
     "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html#property_ATTRS"
    },
    "prototype": {
     "selectedAttrName": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html#attribute_selectedAttrName"
     },
     "getElementsValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html#method_getElementsValue"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.CheckboxCellEditor.html#property_EXTENDS"
    }
   },
   "A.DateCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DateCellEditor",
    "!proto": "aui_component.A.BaseCellEditor",
    "!doc": "DateCellEditor class.",
    "!url": "http://alloyui.com/classes/A.DateCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DateCellEditor.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DateCellEditor.html#property_EXTENDS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the DateCellEditor.",
     "!url": "http://alloyui.com/classes/A.DateCellEditor.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#attribute_bodyContent"
     },
     "calendar": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#attribute_calendar"
     },
     "dateFormat": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#attribute_dateFormat"
     },
     "inputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#attribute_inputFormatter"
     },
     "outputFormatter": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#attribute_outputFormatter"
     },
     "getElementsValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#method_getElementsValue"
     },
     "formatDate": {
      "!type": "fn(date)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DateCellEditor.html#method_formatDate"
     }
    }
   },
   "A.DropDownCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DropDownCellEditor",
    "!proto": "aui_component.A.BaseOptionsCellEditor",
    "!doc": "DropDownCellEditor class.",
    "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the DropDownCellEditor.",
     "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#property_ATTRS"
    },
    "prototype": {
     "multiple": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#attribute_multiple"
     },
     "getElementsValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#method_getElementsValue"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#property_EXTENDS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.DropDownCellEditor.html#property_UI_ATTRS"
    }
   },
   "A.DataTableHighlight": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DataTableHighlight",
    "!proto": "Plugin.Base",
    "!doc": "A base class for DataTableHighlight.",
    "!url": "http://alloyui.com/classes/A.DataTableHighlight.html",
    "prototype": {
     "clear": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#method_clear"
     },
     "getActiveRegion": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#method_getActiveRegion"
     },
     "getSelectionRegion": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#method_getSelectionRegion"
     },
     "activeBorderWidth": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_activeBorderWidth"
     },
     "overlayActiveNode": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_overlayActiveNode"
     },
     "overlayNode": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_overlayNode"
     },
     "highlightRange": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_highlightRange"
     },
     "rangeBorderWidth": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_rangeBorderWidth"
     },
     "type": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#attribute_type"
     }
    },
    "NS": {
     "!type": "string",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#property_NS"
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the DataTableHighlight.",
     "!url": "http://alloyui.com/classes/A.DataTableHighlight.html#property_ATTRS"
    }
   },
   "A.PropertyList": {
    "!type": "fn(config: Object) -> +aui_datatable.A.PropertyList",
    "!proto": "DataTable",
    "!doc": "A base class for PropertyList.",
    "!url": "http://alloyui.com/classes/A.PropertyList.html",
    "prototype": {
     "getDefaultEditor": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#method_getDefaultEditor"
     },
     "columns": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#attribute_columns"
     },
     "scrollable": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#attribute_scrollable"
     },
     "editEvent": {
      "!type": "fn()",
      "!doc": "The event type that will be used to trigger edit mode for a datatable\ncell.",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#attribute_editEvent"
     },
     "width": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.\n\nDataTable scroll breaks when width value is a number\nSee http://yuilibrary.com/projects/yui3/ticket/2532600",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#attribute_width"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Colection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.PropertyList.html#attribute_strings"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "TODO. Wanna help? Please send a Pull Request.",
     "!url": "http://alloyui.com/classes/A.PropertyList.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the PropertyList.",
     "!url": "http://alloyui.com/classes/A.PropertyList.html#property_ATTRS"
    }
   },
   "A.RadioCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.RadioCellEditor",
    "!proto": "aui_datatable.A.CheckboxCellEditor",
    "!doc": "RadioCellEditor class.",
    "!url": "http://alloyui.com/classes/A.RadioCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.RadioCellEditor.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.RadioCellEditor.html#property_EXTENDS"
    },
    "prototype": {
     "getElementsValue": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.RadioCellEditor.html#method_getElementsValue"
     }
    }
   },
   "A.DataTableSelection": {
    "!type": "fn(config: Object) -> +aui_datatable.A.DataTableSelection",
    "!doc": "A base class for DataTableSelection.",
    "!url": "http://alloyui.com/classes/A.DataTableSelection.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the DataTableSelection.",
     "!url": "http://alloyui.com/classes/A.DataTableSelection.html#property_ATTRS"
    },
    "prototype": {
     "activeCell": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#attribute_activeCell"
     },
     "activeCoord": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#attribute_activeCoord"
     },
     "activeRow": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#attribute_activeRow"
     },
     "selection": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#attribute_selection"
     },
     "tabIndex": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#attribute_tabIndex"
     },
     "captureSelection": {
      "!type": "fn(coords)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_captureSelection"
     },
     "getActiveColumn": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_getActiveColumn"
     },
     "getActiveRecord": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_getActiveRecord"
     },
     "getCoord": {
      "!type": "fn(seed)",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_getCoord"
     },
     "getColumn": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_getColumn"
     },
     "getRow": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.\n\nAdd support to get a row by seed on DataTable getRow\nSee http://yuilibrary.com/projects/yui3/ticket/2532605",
      "!url": "http://alloyui.com/classes/A.DataTableSelection.html#method_getRow"
     }
    }
   },
   "A.TextAreaCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.TextAreaCellEditor",
    "!proto": "aui_component.A.BaseCellEditor",
    "!doc": "TextAreaCellEditor class.",
    "!url": "http://alloyui.com/classes/A.TextAreaCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TextAreaCellEditor.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TextAreaCellEditor.html#property_EXTENDS"
    }
   },
   "A.TextCellEditor": {
    "!type": "fn(config: Object) -> +aui_datatable.A.TextCellEditor",
    "!proto": "aui_component.A.BaseCellEditor",
    "!doc": "TextCellEditor class.",
    "!url": "http://alloyui.com/classes/A.TextCellEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TextCellEditor.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TextCellEditor.html#property_EXTENDS"
    }
   }
  },
  "aui_datatype_date_parse": {
   "A.DateParser": {
    "!type": "fn(opt_pattern: string) -> +aui_datatype_date_parse.A.DateParser",
    "!doc": "A base class for `A.DateParser`.",
    "!url": "http://alloyui.com/classes/A.DateParser.html",
    "TOKEN_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the token prefix, e.g. %A.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_TOKEN_PREFIX"
    },
    "TWO_DIGIT_YEAR_BASE": {
     "!type": "number",
     "!doc": "Static property provides a base year to sum two digit years, e.g. For the\nmask %Y, \"13\" will be parsed to 2013.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_TWO_DIGIT_YEAR_BASE"
    },
    "prototype": {
     "compilePattern": {
      "!type": "fn(pattern: string)",
      "!doc": "\"Compiles\" the strftime pattern. The same DateParser instance can be\nreused to other \"compiled\" masks.",
      "!url": "http://alloyui.com/classes/A.DateParser.html#method_compilePattern"
     },
     "parse": {
      "!type": "fn(mask: string, text: string, opt_date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Takes a string mask and a text as input and parses it as a native\nJavaScript Date.",
      "!url": "http://alloyui.com/classes/A.DateParser.html#method_parse"
     }
    },
    "HINTS": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\npossible token values, e.g. year, month, day etc.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS"
    },
    "HINTS.AGGREGATES": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\naggregates tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.AGGREGATES"
    },
    "HINTS.AMPM": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nampm tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.AMPM"
    },
    "HINTS.YEAR": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nyear tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.YEAR"
    },
    "HINTS.MONTH": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nmonth tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.MONTH"
    },
    "HINTS.DAY": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nday tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.DAY"
    },
    "HINTS.HOURS": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nhours tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.HOURS"
    },
    "HINTS.MINUTES": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nminutes tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.MINUTES"
    },
    "HINTS.SECONDS": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\nseconds tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.SECONDS"
    },
    "HINTS.TZ": {
     "!type": "+Object",
     "!doc": "Static property provides an object that contains hints information for\ntimezone tokens.",
     "!url": "http://alloyui.com/classes/A.DateParser.html#property_HINTS.TZ"
    }
   },
   "Date": {
    "!type": "fn()",
    "!url": "http://alloyui.com/classes/Date.html",
    "parse": {
     "!type": "fn(mask: string, text: string, opt_date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
     "!doc": "Takes a string mask and a text as input and parses it as a native JavaScript\nDate. **If only one argument is passed**, the YUI parser will be called for\nbackwards compatibility.",
     "!url": "http://alloyui.com/classes/Date.html#method_parse"
    }
   }
  },
  "aui_datatype": {
   "A.DataType.Boolean": {
    "!type": "fn()",
    "!doc": "`A.DataType.Boolean` provides a set of utility to parse `falsey` value to\n`false` and `non-falsey` to `true`.",
    "!url": "http://alloyui.com/classes/A.DataType.Boolean.html",
    "prototype": {
     "parse": {
      "!type": "fn(data: ?) -> bool",
      "!doc": "Parses any `falsey` value to `false` and `non-falsey` to `true`.",
      "!url": "http://alloyui.com/classes/A.DataType.Boolean.html#method_parse"
     }
    }
   },
   "A.DataType.String": {
    "!type": "fn()",
    "!doc": "`A.DataType.String` provides a set of utility to provides a simple\nfunction that evaluates a string to a primitive value (if possible).\nSupports `true` and `false` also.",
    "!url": "http://alloyui.com/classes/A.DataType.String.html",
    "prototype": {
     "evaluate": {
      "!type": "fn(data: ?) -> bool",
      "!doc": "Evaluates a string to a primitive value (if possible). Supports\n`true` and `false` also. Unrecognized strings are\nreturned without any modification.",
      "!url": "http://alloyui.com/classes/A.DataType.String.html#method_evaluate"
     }
    }
   },
   "A.DataType.DateMath": {
    "!type": "fn()",
    "!doc": "`A.DataType.DateMath` is used for simple date manipulation. The class is a\nstatic utility used for adding, subtracting, and comparing dates. Based on\n`YAHOO.widget.DateMath`.",
    "!url": "http://alloyui.com/classes/A.DataType.DateMath.html",
    "DAY": {
     "!type": "string",
     "!doc": "Constant field representing Day.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_DAY"
    },
    "WEEK": {
     "!type": "string",
     "!doc": "Constant field representing Week.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_WEEK"
    },
    "YEAR": {
     "!type": "string",
     "!doc": "Constant field representing Year.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_YEAR"
    },
    "MONTH": {
     "!type": "string",
     "!doc": "Constant field representing Month.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_MONTH"
    },
    "MINUTES": {
     "!type": "string",
     "!doc": "Constant field representing Minutes.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_MINUTES"
    },
    "HOUR": {
     "!type": "string",
     "!doc": "Constant field representing Hour.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_HOUR"
    },
    "SECONDS": {
     "!type": "string",
     "!doc": "Constant field representing Seconds.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_SECONDS"
    },
    "MAX_MONTH_LENGTH": {
     "!type": "number",
     "!doc": "Constant field representing the number of maximum days in a month.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_MAX_MONTH_LENGTH"
    },
    "WEEK_LENGTH": {
     "!type": "number",
     "!doc": "Constant field representing the number of maximum days in a week.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_WEEK_LENGTH"
    },
    "ONE_DAY_MS": {
     "!type": "number",
     "!doc": "Constant field representing one day, in milliseconds.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_ONE_DAY_MS"
    },
    "ONE_HOUR_MS": {
     "!type": "number",
     "!doc": "Constant field representing one hour, in milliseconds.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_ONE_HOUR_MS"
    },
    "ONE_MINUTE_MS": {
     "!type": "number",
     "!doc": "Constant field representing one minute, in milliseconds.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_ONE_MINUTE_MS"
    },
    "ONE_SECOND_MS": {
     "!type": "number",
     "!doc": "Constant field representing one second, in milliseconds.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_ONE_SECOND_MS"
    },
    "WEEK_ONE_JAN_DATE": {
     "!type": "number",
     "!doc": "Constant field representing the date in first week of January\nwhich identifies the first week of the year.\n\nIn the U.S, Jan 1st is normally used based on a Sunday start of week. ISO\n8601, used widely throughout Europe, uses Jan 4th, based on a Monday\nstart of week.",
     "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#property_WEEK_ONE_JAN_DATE"
    },
    "prototype": {
     "add": {
      "!type": "fn(date: aui_datatype_date_parse.Date, field: string, amount: number) -> +aui_datatype_date_parse.Date",
      "!doc": "Adds the specified amount of time to the this instance.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_add"
     },
     "compare": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Compare dates.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_compare"
     },
     "copyHours": {
      "!type": "fn(d1, d2)",
      "!doc": "Copies hours, minutes, seconds and milliseconds.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_copyHours"
     },
     "subtract": {
      "!type": "fn(date: aui_datatype_date_parse.Date, field: number, amount: number) -> +aui_datatype_date_parse.Date",
      "!doc": "Subtracts the specified amount of time from the this instance.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_subtract"
     },
     "before": {
      "!type": "fn(date: aui_datatype_date_parse.Date, compareTo: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Determines whether a given date is before another date on the calendar.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_before"
     },
     "after": {
      "!type": "fn(date: aui_datatype_date_parse.Date, compareTo: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Determines whether a given date is after another date on the calendar.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_after"
     },
     "between": {
      "!type": "fn(date: aui_datatype_date_parse.Date, dateBegin: aui_datatype_date_parse.Date, dateEnd: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Determines whether a given date is between two other dates on the\ncalendar.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_between"
     },
     "getJan1": {
      "!type": "fn(calendarYear: number) -> +aui_datatype_date_parse.Date",
      "!doc": "Retrieves a JavaScript Date object representing January 1 of any given\nyear.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getJan1"
     },
     "getDayOffset": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> number",
      "!doc": "Calculates the number of days between the specified dates.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getDayOffset"
     },
     "getHoursOffset": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> number",
      "!doc": "Calculates the number of hours between the specified dates.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getHoursOffset"
     },
     "getMinutesOffset": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> number",
      "!doc": "Calculates the number of minutes between the specified dates.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getMinutesOffset"
     },
     "getSecondsOffset": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> number",
      "!doc": "Calculates the number of seconds between the specified dates.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getSecondsOffset"
     },
     "getOffset": {
      "!type": "fn(d1, d2, constantAmount)",
      "!doc": "Returns the amount of time subtracted.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getOffset"
     },
     "getWeekNumber": {
      "!type": "fn(date: aui_datatype_date_parse.Date, firstDayOfWeek: number, janDate: number) -> number",
      "!doc": "Calculates the week number for the given date. Can currently support standard\nU.S. week numbers, based on Jan 1st defining the 1st week of the year, and\nISO8601 week numbers, based on Jan 4th defining the 1st week of the year.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getWeekNumber"
     },
     "getFirstDayOfWeek": {
      "!type": "fn(dt: aui_datatype_date_parse.Date, startOfWeek: number) -> +aui_datatype_date_parse.Date",
      "!doc": "Gets the first day of the week, for the give date.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getFirstDayOfWeek"
     },
     "isWeekDay": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed date is a week day.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isWeekDay"
     },
     "isTueOrThu": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed date is a Tuesday or Thursday.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isTueOrThu"
     },
     "isMonWedOrFri": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed date is a Monday, Wednesday or Friday.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isMonWedOrFri"
     },
     "isNextDay": {
      "!type": "fn(date1: aui_datatype_date_parse.Date, date2: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the {date2} is the next day.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isNextDay"
     },
     "isNextDayBoundary": {
      "!type": "fn(date1: aui_datatype_date_parse.Date, date2: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the {date2} is the next day at 00:00:00.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isNextDayBoundary"
     },
     "isDayOverlap": {
      "!type": "fn(date1: aui_datatype_date_parse.Date, date2: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed date is between two days.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isDayOverlap"
     },
     "isToday": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed date is today.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isToday"
     },
     "isSameMonth": {
      "!type": "fn(d1: aui_datatype_date_parse.Date, d2: aui_datatype_date_parse.Date) -> ?",
      "!doc": "Checks if the passed dates are in the same month.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isSameMonth"
     },
     "isYearOverlapWeek": {
      "!type": "fn(weekBeginDate: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Determines if a given week overlaps two different years.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isYearOverlapWeek"
     },
     "isMonthOverlapWeek": {
      "!type": "fn(weekBeginDate: aui_datatype_date_parse.Date) -> bool",
      "!doc": "Determines if a given week overlaps two different months.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_isMonthOverlapWeek"
     },
     "findMonthStart": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Getss the first day of a month containing a given date.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_findMonthStart"
     },
     "findMonthEnd": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Gets the last day of a month containing a given date.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_findMonthEnd"
     },
     "clearTime": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Clears the time fields from a given date, effectively setting the time to\n12 noon.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_clearTime"
     },
     "safeClearTime": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Clears the time fields from a given date, effectively setting the time to\n12 noon. This is \"safe\" because clones the date before clear, not\naffecting the passed reference.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_safeClearTime"
     },
     "toLastHour": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Sets the time fields from a given date to the last possible hour.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_toLastHour"
     },
     "toMidnight": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Sets the time fields from a given date to midnight.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_toMidnight"
     },
     "clone": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Clones the passed date object.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_clone"
     },
     "getDate": {
      "!type": "fn(y: number, m: number, d: number) -> +aui_datatype_date_parse.Date",
      "!doc": "Returns a new JavaScript Date object, representing the given year,\nmonth and date. Time fields (hr, min, sec, ms) on the new Date object\nare set to 0. The method allows Date instances to be created with the a\nyear less than 100. \"new Date(year, month, date)\" implementations\nset the year to 19xx if a year (xx) which is less than 100 is provided.\n\n**NOTE:** Validation on argument values is not performed. It is the\ncaller's responsibility to ensure arguments are valid as per the\nECMAScript-262 Date object specification for the\nnew Date(year, month[, date]) constructor.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getDate"
     },
     "getDaysInMonth": {
      "!type": "fn(year, month) -> +aui_datatype_date_parse.Date",
      "!doc": "Gets date from a given month and year.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_getDaysInMonth"
     },
     "toUsTimeString": {
      "!type": "fn(date, padHours, omitMinutes, hideAmPm) -> string",
      "!doc": "Converts a date to US time format.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_toUsTimeString"
     },
     "toIsoTimeString": {
      "!type": "fn(date, showSeconds) -> string",
      "!doc": "Converts a date to ISO time format.",
      "!url": "http://alloyui.com/classes/A.DataType.DateMath.html#method_toIsoTimeString"
     }
    }
   }
  },
  "aui_datepicker": {
   "A.DatePickerDelegate": {
    "!type": "fn(config: Object) -> +aui_datepicker.A.DatePickerDelegate",
    "!doc": "A base class for `DatePickerDelegate`.",
    "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html",
    "prototype": {
     "getSelectedDates": {
      "!type": "fn(node) -> +Object",
      "!doc": "Gets the selected dates.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#method_getSelectedDates"
     },
     "getParsedDatesFromInputValue": {
      "!type": "fn(opt_value) -> +Object",
      "!doc": "Gets parsed dates from input value.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#method_getParsedDatesFromInputValue"
     },
     "useInputNode": {
      "!type": "fn()",
      "!doc": "Method not implemented.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#method_useInputNode"
     },
     "useInputNodeOnce": {
      "!type": "fn(node)",
      "!doc": "Triggers `useInputNode` method once.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#method_useInputNodeOnce"
     },
     "activeInput": {
      "!type": "fn()",
      "!doc": "The active input element that holds the calendar instance.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_activeInput"
     },
     "container": {
      "!type": "fn()",
      "!doc": "Contains an element.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_container"
     },
     "dateSeparator": {
      "!type": "fn()",
      "!doc": "Character that separate dates.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_dateSeparator"
     },
     "mask": {
      "!type": "fn()",
      "!doc": "Defines the date format.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_mask"
     },
     "trigger": {
      "!type": "fn()",
      "!doc": "Stores a trigger.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_trigger"
     },
     "valueExtractor": {
      "!type": "fn()",
      "!doc": "Extracts a value from a function.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_valueExtractor"
     },
     "valueFormatter": {
      "!type": "fn()",
      "!doc": "Formats a value from a function.",
      "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#attribute_valueFormatter"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for the\n`DatePickerDelegate`.",
     "!url": "http://alloyui.com/classes/A.DatePickerDelegate.html#property_ATTRS"
    }
   },
   "A.DatePickerNativeBase": {
    "!type": "fn(config: Object) -> +aui_datepicker.A.DatePickerNativeBase",
    "!doc": "A base class for `DatePickerNativeBase`.",
    "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for the\n`DatePickerNativeBase`.",
     "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#property_ATTRS"
    },
    "prototype": {
     "nativeMask": {
      "!type": "fn()",
      "!doc": "Defines the native date mask.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#attribute_nativeMask"
     },
     "nativeType": {
      "!type": "fn()",
      "!doc": "Defines the type attribute in an HTML element.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#attribute_nativeType"
     },
     "bindNativeUI": {
      "!type": "fn()",
      "!doc": "Bind the events on the `DatePickerNativeBase` UI. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_bindNativeUI"
     },
     "clearSelection": {
      "!type": "fn()",
      "!doc": "Clears selected dates in the native calendar.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_clearSelection"
     },
     "deselectDates": {
      "!type": "fn()",
      "!doc": "Deselects dates in the native calendar.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_deselectDates"
     },
     "hide": {
      "!type": "fn()",
      "!doc": "Blurs native calendar.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_hide"
     },
     "show": {
      "!type": "fn()",
      "!doc": "Focus native calendar.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_show"
     },
     "selectDates": {
      "!type": "fn(dates)",
      "!doc": "Selects a date in the native calendar.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_selectDates"
     },
     "useInputNode": {
      "!type": "fn(node)",
      "!doc": "Renders the widget in an `<input>` node.",
      "!url": "http://alloyui.com/classes/A.DatePickerNativeBase.html#method_useInputNode"
     }
    }
   },
   "A.DatePickerPopover": {
    "!type": "fn(config: Object) -> +aui_datepicker.A.DatePickerPopover",
    "!doc": "A base class for `DatePickerPopover`.",
    "!url": "http://alloyui.com/classes/A.DatePickerPopover.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for the\n`DatePickerPopover`.",
     "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#property_ATTRS"
    },
    "prototype": {
     "autoHide": {
      "!type": "fn()",
      "!doc": "Sets the initial visibility.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#attribute_autoHide"
     },
     "popover": {
      "!type": "fn()",
      "!doc": "Stores the configuration of the `Popover` instance.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#attribute_popover"
     },
     "popoverCssClass": {
      "!type": "fn()",
      "!doc": "Defines the CSS classname of the `Popover`.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#attribute_popoverCssClass"
     },
     "alignTo": {
      "!type": "fn(node)",
      "!doc": "Sets the `Popover` alignment.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#method_alignTo"
     },
     "getPopover": {
      "!type": "fn() -> +Popover",
      "!doc": "Returns an existent `Popover` instance or creates a new one if it\ndoesn't exists.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#method_getPopover"
     },
     "hide": {
      "!type": "fn()",
      "!doc": "Hides the `Popover`.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#method_hide"
     },
     "show": {
      "!type": "fn()",
      "!doc": "Shows the `Popover`.",
      "!url": "http://alloyui.com/classes/A.DatePickerPopover.html#method_show"
     }
    }
   },
   "A.DatePickerBase": {
    "!type": "fn(config: Object) -> +aui_datepicker.A.DatePickerBase",
    "!doc": "A base class for `DatePickerBase`.",
    "!url": "http://alloyui.com/classes/A.DatePickerBase.html",
    "PANES": {
     "!type": "+Array",
     "!doc": "Lists `CalendarBase` pane templates.",
     "!url": "http://alloyui.com/classes/A.DatePickerBase.html#property_PANES"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for the\n`DatePickerBase`.",
     "!url": "http://alloyui.com/classes/A.DatePickerBase.html#property_ATTRS"
    },
    "prototype": {
     "calendar": {
      "!type": "fn()",
      "!doc": "Stores the configuration of the `Calendar` instance.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#attribute_calendar"
     },
     "autoHide": {
      "!type": "fn()",
      "!doc": "Sets the initial visibility.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#attribute_autoHide"
     },
     "panes": {
      "!type": "fn()",
      "!doc": "Defines how many panes should be rendered.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#attribute_panes"
     },
     "clearSelection": {
      "!type": "fn(silent)",
      "!doc": "Clears a selection in the `Calendar`.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#method_clearSelection"
     },
     "deselectDates": {
      "!type": "fn(dates)",
      "!doc": "Deselects a date in the `Calendar`.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#method_deselectDates"
     },
     "getCalendar": {
      "!type": "fn() -> +Calendar",
      "!doc": "Returns an existent `Calendar` instance or creates a new one if it\ndoesn't exists.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#method_getCalendar"
     },
     "selectDates": {
      "!type": "fn(dates)",
      "!doc": "Selects a date in the `Calendar`.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#method_selectDates"
     },
     "useInputNode": {
      "!type": "fn(node)",
      "!doc": "Renders the widget in an `<input>` node.",
      "!url": "http://alloyui.com/classes/A.DatePickerBase.html#method_useInputNode"
     }
    }
   }
  },
  "aui_diagram_builder": {
   "A.Connector": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.Connector",
    "!proto": "Base",
    "!doc": "A base class for Connector.",
    "!url": "http://alloyui.com/classes/A.Connector.html",
    "prototype": {
     "draw": {
      "!type": "fn()",
      "!doc": "Responsible for drawing the connectors.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_draw"
     },
     "getProperties": {
      "!type": "fn() -> +Array",
      "!doc": "Gets the list of properties from the property model.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_getProperties"
     },
     "getPropertyModel": {
      "!type": "fn() -> +Array",
      "!doc": "Gets the model defition of a property.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_getPropertyModel"
     },
     "getStrings": {
      "!type": "fn()",
      "!doc": "Gets the collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_getStrings"
     },
     "hide": {
      "!type": "fn()",
      "!doc": "Sets the visibility to `false`.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_hide"
     },
     "show": {
      "!type": "fn()",
      "!doc": "Sets the visibility to `true`.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_show"
     },
     "coord": {
      "!type": "fn()",
      "!doc": "Converts a coordinate to X and Y positions.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_coord"
     },
     "toJSON": {
      "!type": "fn() -> +Object",
      "!doc": "Converts serializable attributes to JSON format.",
      "!url": "http://alloyui.com/classes/A.Connector.html#method_toJSON"
     },
     "arrowPoints": {
      "!type": "fn()",
      "!doc": "Arrow points from `A.PolygonUtil` instance.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_arrowPoints"
     },
     "builder": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.DiagramBuilder`.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_builder"
     },
     "color": {
      "!type": "fn()",
      "!doc": "The color used in the connector.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_color"
     },
     "graphic": {
      "!type": "fn()",
      "!doc": "Graphic used to represent the connector.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_graphic"
     },
     "lazyDraw": {
      "!type": "fn()",
      "!doc": "Determine if the draw should be delayed or not.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_lazyDraw"
     },
     "name": {
      "!type": "fn()",
      "!doc": "The name of the connector.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_name"
     },
     "nodeName": {
      "!type": "fn()",
      "!doc": "The connector node name.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_nodeName"
     },
     "p1": {
      "!type": "fn()",
      "!doc": "Origin connector position.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_p1"
     },
     "p2": {
      "!type": "fn()",
      "!doc": "Destination connector position.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_p2"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Checks if a connector is selected or not.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_selected"
     },
     "shape": {
      "!type": "fn()",
      "!doc": "Graphic used to represent the connector's shape.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shape"
     },
     "shapeArrow": {
      "!type": "fn()",
      "!doc": "Graphic used to represent the connector's shape arrow.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shapeArrow"
     },
     "shapeArrowHover": {
      "!type": "fn()",
      "!doc": "Collection of styles applied when mouse is over the shape arrow.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shapeArrowHover"
     },
     "shapeArrowSelected": {
      "!type": "fn()",
      "!doc": "Collection of styles applied when shape arrow is selected.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shapeArrowSelected"
     },
     "shapeHover": {
      "!type": "fn()",
      "!doc": "Collection of styles applied when mouse is over the shape.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shapeHover"
     },
     "shapeSelected": {
      "!type": "fn()",
      "!doc": "Collection of styles applied when shape is selected.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_shapeSelected"
     },
     "showName": {
      "!type": "fn()",
      "!doc": "Sets the visibility of the connector name.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_showName"
     },
     "transition": {
      "!type": "fn()",
      "!doc": "Stores the uid, source and target data from a connector.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_transition"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Indicates whether or not the connector is visible.",
      "!url": "http://alloyui.com/classes/A.Connector.html#attribute_visible"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.Connector`.",
     "!url": "http://alloyui.com/classes/A.Connector.html#property_ATTRS"
    },
    "STRINGS": {
     "!type": "+Object",
     "!doc": "Collection of strings used to label elements of the UI.",
     "!url": "http://alloyui.com/classes/A.Connector.html#property_STRINGS"
    }
   },
   "A.DiagramBuilder": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramBuilder",
    "!proto": "aui_property_builder.A.PropertyBuilder",
    "!doc": "A base class for Diagram Builder.\n\nCheck the [live demo](http://alloyui.com/examples/diagram-builder/).",
    "!url": "http://alloyui.com/classes/A.DiagramBuilder.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramBuilder`.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_ATTRS"
    },
    "prototype": {
     "connector": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.Connector`.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_connector"
     },
     "fieldsDragConfig": {
      "!type": "fn()",
      "!doc": "Configuration object for draggable fields.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_fieldsDragConfig"
     },
     "graphic": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.Graphic`.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_graphic"
     },
     "highlightDropZones": {
      "!type": "fn()",
      "!doc": "Checks if the drop zones should be highlighted or not.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_highlightDropZones"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_strings"
     },
     "showSuggestConnector": {
      "!type": "fn()",
      "!doc": "Checks if a connector suggestion is visible or not.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_showSuggestConnector"
     },
     "suggestConnectorOverlay": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.Overlay` used in the connector suggestion.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#attribute_suggestConnectorOverlay"
     },
     "syncConnectionsUI": {
      "!type": "fn()",
      "!doc": "Syncs the connections in the UI.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_syncConnectionsUI"
     },
     "clearFields": {
      "!type": "fn()",
      "!doc": "Fetches all fields and destroys each instance of it.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_clearFields"
     },
     "closeEditProperties": {
      "!type": "fn()",
      "!doc": "Disables the settings tab and selects the field tab.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_closeEditProperties"
     },
     "connect": {
      "!type": "fn(diagramNode1, diagramNode2, optConnector)",
      "!doc": "Gets two `A.DiagramNode` instances and connect them.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_connect"
     },
     "connectAll": {
      "!type": "fn(nodes)",
      "!doc": "Creates a connector for each node that has source and target\nproperties.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_connectAll"
     },
     "createField": {
      "!type": "fn(val)",
      "!doc": "Creates a new field based on the field class type.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_createField"
     },
     "deleteSelectedConnectors": {
      "!type": "fn()",
      "!doc": "Fetches all selected connectors and disconnect them.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_deleteSelectedConnectors"
     },
     "deleteSelectedNode": {
      "!type": "fn()",
      "!doc": "Fetches the selected node and delete it.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_deleteSelectedNode"
     },
     "eachConnector": {
      "!type": "fn(fn)",
      "!doc": "An utility function to loop through all connectors.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_eachConnector"
     },
     "editConnector": {
      "!type": "fn(connector)",
      "!doc": "Enables the settings tab, sets the connector properties in the\nproperty list, and stores the connector in the `editingConnector` and\n`selectedConnector` attributes.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_editConnector"
     },
     "editNode": {
      "!type": "fn(diagramNode)",
      "!doc": "Enables the settings tab, sets the node properties in the property\nlist, and stores the node in the `editingNode` and `selectedNode`\nattributes.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_editNode"
     },
     "getFieldClass": {
      "!type": "fn(type)",
      "!doc": "Gets the field class based on the `A.DiagramBuilder` type. If the type\ndoesn't exist, logs an error message.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_getFieldClass"
     },
     "getNodesByTransitionProperty": {
      "!type": "fn(property, value)",
      "!doc": "Returns a collection of nodes by its transition property.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_getNodesByTransitionProperty"
     },
     "getSelectedConnectors": {
      "!type": "fn()",
      "!doc": "Returns a collection of selected connectors.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_getSelectedConnectors"
     },
     "getSourceNodes": {
      "!type": "fn(diagramNode)",
      "!doc": "Returns a collection of source nodes.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_getSourceNodes"
     },
     "hideSuggestConnectorOverlay": {
      "!type": "fn(diagramNode, drag)",
      "!doc": "Hides the suggest connector overlay.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_hideSuggestConnectorOverlay"
     },
     "isAbleToConnect": {
      "!type": "fn()",
      "!doc": "Checks if a node is able to connect with another.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_isAbleToConnect"
     },
     "isFieldsDrag": {
      "!type": "fn(drag)",
      "!doc": "Checks if the field is draggable.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_isFieldsDrag"
     },
     "plotField": {
      "!type": "fn(field)",
      "!doc": "Renders a field in the `dropContainer`.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_plotField"
     },
     "select": {
      "!type": "fn(diagramNode)",
      "!doc": "Selects and focus a certain node.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_select"
     },
     "showSuggestConnectorOverlay": {
      "!type": "fn(xy)",
      "!doc": "Shows the suggest connector overlay in a certain X and Y position.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_showSuggestConnectorOverlay"
     },
     "stopEditing": {
      "!type": "fn()",
      "!doc": "Clears node/connectors selections and close edit properties.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_stopEditing"
     },
     "toJSON": {
      "!type": "fn() -> +Object",
      "!doc": "Converts fields to JSON format.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_toJSON"
     },
     "unselectConnectors": {
      "!type": "fn()",
      "!doc": "Clears connectors selection.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_unselectConnectors"
     },
     "unselectNodes": {
      "!type": "fn()",
      "!doc": "Clears nodes selection.",
      "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#method_unselectNodes"
     }
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_AUGMENTS"
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_EXTENDS"
    },
    "FIELDS_TAB": {
     "!type": "number",
     "!doc": "The index of the fields tab.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_FIELDS_TAB"
    },
    "SETTINGS_TAB": {
     "!type": "number",
     "!doc": "The index of the settings tab.",
     "!url": "http://alloyui.com/classes/A.DiagramBuilder.html#property_SETTINGS_TAB"
    }
   },
   "A.DiagramNodeCondition": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeCondition",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for DiagramNodeCondition.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeCondition`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#attribute_height"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#attribute_width"
     },
     "renderShapeBoundary": {
      "!type": "fn()",
      "!doc": "Renders the shape boundary.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#method_renderShapeBoundary"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeCondition.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeEnd": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeEnd",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for DiagramNodeEnd.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeEnd.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeEnd.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeEnd`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeEnd.html#property_ATTRS"
    },
    "prototype": {
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeEnd.html#attribute_type"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeEnd.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeFork": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeFork",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for DiagramNodeFork.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeFork`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#attribute_height"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#attribute_width"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeFork.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeJoin": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeJoin",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for DiagramNodeJoin.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeJoin`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#attribute_height"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#attribute_width"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeJoin.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeManagerBase": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeManagerBase",
    "!proto": "Base",
    "!doc": "A base class for DiagramNodeManagerBase.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeManagerBase.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeManagerBase.html#property_NAME"
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeManagerBase.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeStart": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeStart",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for DiagramNodeStart.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeStart.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeStart.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeStart`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeStart.html#property_ATTRS"
    },
    "prototype": {
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeStart.html#attribute_type"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeStart.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeState": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeState",
    "!proto": "aui_diagram_builder.A.DiagramNode",
    "!doc": "A base class for DiagramNodeState.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeState.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeState`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#attribute_height"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#attribute_width"
     },
     "renderShapeBoundary": {
      "!type": "fn()",
      "!doc": "Renders the shape boundary.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#method_renderShapeBoundary"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeState.html#property_EXTENDS"
    }
   },
   "A.DiagramNodeTask": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNodeTask",
    "!proto": "aui_diagram_builder.A.DiagramNodeState",
    "!doc": "A base class for `A.DiagramNodeTask`.",
    "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNodeTask`.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#property_ATTRS"
    },
    "prototype": {
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#attribute_height"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#attribute_width"
     },
     "renderShapeBoundary": {
      "!type": "fn()",
      "!doc": "Renders the shape boundary.",
      "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#method_renderShapeBoundary"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNodeTask.html#property_EXTENDS"
    }
   },
   "A.DiagramNode": {
    "!type": "fn(config: Object) -> +aui_diagram_builder.A.DiagramNode",
    "!proto": "Overlay",
    "!doc": "A base class for DiagramNode.",
    "!url": "http://alloyui.com/classes/A.DiagramNode.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_NAME"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_UI_ATTRS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.DiagramNode`.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_ATTRS"
    },
    "prototype": {
     "builder": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.PropertyBuilder`.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_builder"
     },
     "connectors": {
      "!type": "fn()",
      "!doc": "A map of connectors.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_connectors"
     },
     "controlsToolbar": {
      "!type": "fn()",
      "!doc": "A toolbar to represent controls.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_controlsToolbar"
     },
     "description": {
      "!type": "fn()",
      "!doc": "The description of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_description"
     },
     "graphic": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.Graphic`.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_graphic"
     },
     "height": {
      "!type": "fn()",
      "!doc": "The height of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_height"
     },
     "highlighted": {
      "!type": "fn()",
      "!doc": "Checks if a node is highlighted or not.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_highlighted"
     },
     "name": {
      "!type": "fn()",
      "!doc": "The name of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_name"
     },
     "required": {
      "!type": "fn()",
      "!doc": "Checks if a node is required or not.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_required"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Checks if a node is selected or not.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_selected"
     },
     "shapeBoundary": {
      "!type": "fn()",
      "!doc": "A graphic shape to represent a boundary.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_shapeBoundary"
     },
     "highlightBoundaryStroke": {
      "!type": "fn()",
      "!doc": "Represents a stroke to highlight a boundary.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_highlightBoundaryStroke"
     },
     "shapeInvite": {
      "!type": "fn()",
      "!doc": "Configuration object to generate the shape invite graphic.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_shapeInvite"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_strings"
     },
     "tabIndex": {
      "!type": "fn()",
      "!doc": "Specify the tab order of elements.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_tabIndex"
     },
     "transitions": {
      "!type": "fn()",
      "!doc": "Map of transitions that stores the uid, source and target data from\nconnectors.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_transitions"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_type"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_width"
     },
     "zIndex": {
      "!type": "fn()",
      "!doc": "Specify the stack order of elements.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#attribute_zIndex"
     },
     "addTransition": {
      "!type": "fn(transition)",
      "!doc": "Adds a transition into the node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_addTransition"
     },
     "alignTransition": {
      "!type": "fn(transition)",
      "!doc": "Aligns a single transition.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_alignTransition"
     },
     "alignTransitions": {
      "!type": "fn()",
      "!doc": "Aligns a collection of transitions.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_alignTransitions"
     },
     "close": {
      "!type": "fn()",
      "!doc": "Destroys this instance.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_close"
     },
     "connect": {
      "!type": "fn(transition, optConnector)",
      "!doc": "Checks if a transition is connected, if not creates a new\n`A.Connector` instance.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connect"
     },
     "connectDrop": {
      "!type": "fn(event)",
      "!doc": "Calls the `connectNode` method with `publishedTarget` parameter.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectDrop"
     },
     "connectEnd": {
      "!type": "fn(event)",
      "!doc": "Handles the `connectEnd` event.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectEnd"
     },
     "connectMove": {
      "!type": "fn(event)",
      "!doc": "Sets the connector position based on the mouse X and Y positions.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectMove"
     },
     "connectNode": {
      "!type": "fn(diagramNode)",
      "!doc": "Prepares the transition and connects a node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectNode"
     },
     "connectOutTarget": {
      "!type": "fn(event)",
      "!doc": "Sets the `publishedTarget` attribute to null and hiddes the\n`publishedSource`'s invite.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectOutTarget"
     },
     "connectOverTarget": {
      "!type": "fn(event)",
      "!doc": "If `publishedSource` is different from the current instance, sets the\n`publishedTarget` to the current instance.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectOverTarget"
     },
     "connectStart": {
      "!type": "fn(event)",
      "!doc": "Highlights each diagram node and fires a `publishedSource` event.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_connectStart"
     },
     "disconnect": {
      "!type": "fn(transition)",
      "!doc": "Checks if a transition is connected, if yes removes the transition.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_disconnect"
     },
     "eachConnector": {
      "!type": "fn(fn)",
      "!doc": "An utility function to loop through all connectors.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_eachConnector"
     },
     "getConnector": {
      "!type": "fn(transition)",
      "!doc": "Returns a connector based on the transition uid.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_getConnector"
     },
     "getContainer": {
      "!type": "fn()",
      "!doc": "Returns the `dropContainer` or bounding box's parent node.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_getContainer"
     },
     "getNodeCoordinates": {
      "!type": "fn()",
      "!doc": "Returns the left and top positions of a node based in its container.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_getNodeCoordinates"
     },
     "getProperties": {
      "!type": "fn() -> +Array",
      "!doc": "Gets the list of properties from the property model.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_getProperties"
     },
     "getPropertyModel": {
      "!type": "fn() -> +Array",
      "!doc": "Gets the model defition of a property.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_getPropertyModel"
     },
     "isBoundaryDrag": {
      "!type": "fn(drag) -> bool",
      "!doc": "Checks if boundary is draggable.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_isBoundaryDrag"
     },
     "isTransitionConnected": {
      "!type": "fn(transition)",
      "!doc": "Checks if a connector has an transition uid property.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_isTransitionConnected"
     },
     "prepareTransition": {
      "!type": "fn(val)",
      "!doc": "Builds the transition configuration object.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_prepareTransition"
     },
     "removeTransition": {
      "!type": "fn(transition)",
      "!doc": "Removes the transition uid from a transition.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_removeTransition"
     },
     "renderShapeBoundary": {
      "!type": "fn()",
      "!doc": "Renders the `shapeBoundary` attribute.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_renderShapeBoundary"
     },
     "renderShapeInvite": {
      "!type": "fn()",
      "!doc": "Renders the `shapeInvite` attribute.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_renderShapeInvite"
     },
     "syncConnectionsUI": {
      "!type": "fn()",
      "!doc": "Syncs the connections in the UI.",
      "!url": "http://alloyui.com/classes/A.DiagramNode.html#method_syncConnectionsUI"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_EXTENDS"
    },
    "CIRCLE_POINTS": {
     "!type": "+Array",
     "!doc": "Coordinates to generate a circle graphic.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_CIRCLE_POINTS"
    },
    "DIAMOND_POINTS": {
     "!type": "+Array",
     "!doc": "Coordinates to generate a diamond graphic.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_DIAMOND_POINTS"
    },
    "SQUARE_POINTS": {
     "!type": "+Array",
     "!doc": "Coordinates to generate a square graphic.",
     "!url": "http://alloyui.com/classes/A.DiagramNode.html#property_SQUARE_POINTS"
    }
   },
   "A.Dropdown": {
    "!type": "fn(config: Object) -> +aui_dropdown.A.Dropdown",
    "!proto": "Widget",
    "!doc": "A base class for Dropdown.\n\nCheck the [live demo](http://alloyui.com/examples/dropdown/).",
    "!url": "http://alloyui.com/classes/A.Dropdown.html",
    "prototype": {
     "undefined": {
      "!type": "fn()",
      "!url": "http://alloyui.com/classes/A.Dropdown.html"
     }
    }
   }
  },
  "aui_dropdown": {
   "A.Dropdown": {
    "!type": "fn(config: Object) -> +aui_dropdown.A.Dropdown",
    "!proto": "Widget",
    "!doc": "A base class for Dropdown.\n\nCheck the [live demo](http://alloyui.com/examples/dropdown/).",
    "!url": "http://alloyui.com/classes/A.Dropdown.html",
    "prototype": {
     "bringToTop": {
      "!type": "fn()",
      "!doc": "Brings the dropdown to the top of the zIndex stack on open.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_bringToTop"
     },
     "close": {
      "!type": "fn()",
      "!doc": "Close the dropdown.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#method_close"
     },
     "open": {
      "!type": "fn()",
      "!doc": "Determines the dropdown state. Note that `open` state is different\nthan `visible` state since it only adds or removes an `open` css\nclass on the `boundingBox` instead of toggling its visibility.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_open"
     },
     "toggleContent": {
      "!type": "fn()",
      "!doc": "Toggles open state of the dropdown.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#method_toggleContent"
     },
     "focusmanager": {
      "!type": "fn()",
      "!doc": "Defines the keyboard configuration object for\n`Plugin.NodeFocusManager`.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_focusmanager"
     },
     "items": {
      "!type": "fn()",
      "!doc": "Holds a NodeList containing the menu items.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_items"
     },
     "hideOnEsc": {
      "!type": "fn()",
      "!doc": "Determines if dropdown will close when press escape.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_hideOnEsc"
     },
     "hideOnClickOutSide": {
      "!type": "fn()",
      "!doc": "Determines if dropdown will close when click outside the\n`boundingBox` area.",
      "!url": "http://alloyui.com/classes/A.Dropdown.html#attribute_hideOnClickOutSide"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Dropdown.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for\nthe Dropdown.",
     "!url": "http://alloyui.com/classes/A.Dropdown.html#property_ATTRS"
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values have to be parsed from markup.",
     "!url": "http://alloyui.com/classes/A.Dropdown.html#property_HTML_PARSER"
    },
    "Z_INDEX": {
     "!type": "number",
     "!doc": "Holds the highest value for the global zIndex responsible to bring the\ndropdown menus to the top if `bringToTop` attribute is set to `true`.",
     "!url": "http://alloyui.com/classes/A.Dropdown.html#property_Z_INDEX"
    }
   }
  },
  "aui_event": {
   "A.FormBuilderAvailableField": {
    "!type": "fn(config: Object) -> +aui_event.A.FormBuilderAvailableField",
    "!proto": "aui_promise.A.PropertyBuilderAvailableField",
    "!doc": "A base class for `A.FormBuilderAvailableField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html",
    "prototype": {
     "hasModifier": {
      "!type": "fn() -> bool",
      "!doc": "Checks if an event is triggered by a keyboard key like `CTRL`, `ALT`\nor `SHIFT`.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_hasModifier"
     },
     "isKey": {
      "!type": "fn(name) -> bool",
      "!doc": "Checks if an event is triggered by a keyboard key.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isKey"
     },
     "isKeyInRange": {
      "!type": "fn(start, end) -> bool",
      "!doc": "Checks if an event is triggered by a keyboard key located between two\nother keys.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isKeyInRange"
     },
     "isKeyInSet": {
      "!type": "fn() -> bool",
      "!doc": "Checks if an event is triggered by a keyboard key contained in the\nkey set.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isKeyInSet"
     },
     "isModifyingKey": {
      "!type": "fn()",
      "!doc": "Checks if an event is triggered by `ENTER`, `TAB`, `ESC` keyboard\nkeys or by a key located between `PAGE UP` and `DOWN`.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isModifyingKey"
     },
     "isNavKey": {
      "!type": "fn() -> bool",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isNavKey"
     },
     "isSpecialKey": {
      "!type": "fn() -> bool",
      "!doc": "Checks if an event is triggered by a special keyboard key like\n`SHIFT`, `CAPS LOCK`, etc.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_isSpecialKey"
     },
     "change": {
      "!type": "fn()",
      "!doc": "Defines a new `change` event in the DOM event system.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#event_change"
     },
     "delegate": {
      "!type": "fn(node, subscription, notifier, filter)",
      "!doc": "Implementation logic for subscription via `node.delegate`.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_delegate"
     },
     "detach": {
      "!type": "fn(node, subscription, notifier)",
      "!doc": "Implementation logic for cleaning up a detached subscription.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_detach"
     },
     "detachDelegate": {
      "!type": "fn(node, subscription, notifier)",
      "!doc": "Implementation logic for cleaning up a detached delegate subscription.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_detachDelegate"
     },
     "on": {
      "!type": "fn(node, subscription, notifier)",
      "!doc": "Implementation logic for event subscription.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#method_on"
     },
     "submit": {
      "!type": "fn()",
      "!doc": "Defines a new `submit` event in the DOM event system.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#event_submit"
     },
     "input": {
      "!type": "fn()",
      "!doc": "Defines a new `input` event in the DOM event system.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#event_input"
     },
     "hiddenAttributes": {
      "!type": "fn()",
      "!doc": "List of hidden attributes.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_hiddenAttributes"
     },
     "options": {
      "!type": "fn()",
      "!doc": "Collection of options.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_options"
     },
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_predefinedValue"
     },
     "readOnlyAttributes": {
      "!type": "fn()",
      "!doc": "List of read-only input fields.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_readOnlyAttributes"
     },
     "required": {
      "!type": "fn()",
      "!doc": "Checks if an input field is required. In other words, it needs\ncontent to be valid.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_required"
     },
     "showLabel": {
      "!type": "fn()",
      "!doc": "If `true` the label is showed.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_showLabel"
     },
     "tip": {
      "!type": "fn()",
      "!doc": "Hint to help the user to fill the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_tip"
     },
     "unique": {
      "!type": "fn()",
      "!doc": "Checks if the input field is unique or not.",
      "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#attribute_unique"
     }
    },
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderAvailableField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#property_ATTRS"
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderAvailableField.html#property_EXTENDS"
    }
   }
  },
  "aui_form_builder": {
   "A.FormBuilderButtonField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderButtonField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderButtonField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderButtonField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#property_ATTRS"
    },
    "prototype": {
     "acceptChildren": {
      "!type": "fn()",
      "!doc": "If `true` children are accepted.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#attribute_acceptChildren"
     },
     "buttonType": {
      "!type": "fn()",
      "!doc": "Defines the button type attribute, e.g. `type=\"reset\"`.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#attribute_buttonType"
     },
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the button field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#attribute_predefinedValue"
     },
     "showLabel": {
      "!type": "fn()",
      "!doc": "If `true` the label is showed.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#attribute_showLabel"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#attribute_template"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#method_getHTML"
     },
     "getPropertyModel": {
      "!type": "fn() -> +Array",
      "!doc": "Returns a list of property models including the `A.RadioCellEditor`\nmodel.",
      "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#method_getPropertyModel"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#property_UI_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderButtonField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderCheckBoxField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderCheckBoxField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderCheckBoxField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderCheckBoxField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#property_ATTRS"
    },
    "prototype": {
     "dataType": {
      "!type": "fn()",
      "!doc": "Indicates which is the type of data for the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#attribute_dataType"
     },
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the checkbox field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#attribute_predefinedValue"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#attribute_template"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the `A.RadioCellEditor`\nmodel.",
      "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#method_getPropertyModel"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#method_getHTML"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderCheckBoxField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderFieldsetField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderFieldsetField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderFieldsetField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderFieldsetField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#property_ATTRS"
    },
    "prototype": {
     "acceptChildren": {
      "!type": "fn()",
      "!doc": "If `true` children are accepted.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#attribute_acceptChildren"
     },
     "dataType": {
      "!type": "fn()",
      "!doc": "Indicates which is the type of data for the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#attribute_dataType"
     },
     "labelNode": {
      "!type": "fn()",
      "!doc": "Markup used to generate a label.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#attribute_labelNode"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#attribute_template"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#method_getHTML"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the `A.TextCellEditor()`\nand `A.RadioCellEditor` models.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#method_getPropertyModel"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#property_UI_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFieldsetField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderFileUploadField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderFileUploadField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderFileUploadField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderFileUploadField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#property_ATTRS"
    },
    "prototype": {
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#attribute_template"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#method_getHTML"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderFileUploadField.html#property_EXTENDS"
    }
   },
   "A.OptionsEditor": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.OptionsEditor",
    "!proto": "aui_datatable.A.RadioCellEditor",
    "!doc": "A base class for `A.OptionsEditor`.",
    "!url": "http://alloyui.com/classes/A.OptionsEditor.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.OptionsEditor.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.OptionsEditor`.",
     "!url": "http://alloyui.com/classes/A.OptionsEditor.html#property_ATTRS"
    },
    "prototype": {
     "editable": {
      "!type": "fn()",
      "!doc": "Defines if a field is editable.",
      "!url": "http://alloyui.com/classes/A.OptionsEditor.html#attribute_editable"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.OptionsEditor.html#property_EXTENDS"
    }
   },
   "A.FormBuilderMultipleChoiceField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderMultipleChoiceField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderMultipleChoiceField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderMultipleChoiceField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#property_ATTRS"
    },
    "prototype": {
     "acceptChildren": {
      "!type": "fn()",
      "!doc": "If `true` children are accepted.",
      "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#attribute_acceptChildren"
     },
     "options": {
      "!type": "fn()",
      "!doc": "Collection of options. Each option is made of a label and value.",
      "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#attribute_options"
     },
     "optionTemplate": {
      "!type": "fn()",
      "!doc": "Markup used to generate each item from `options` attribute.",
      "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#attribute_optionTemplate"
     },
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the multiple choice field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#attribute_predefinedValue"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the `A.RadioCellEditor`\nmodel.",
      "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#method_getPropertyModel"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#property_UI_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderMultipleChoiceField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderRadioField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderRadioField",
    "!proto": "aui_form_builder.A.FormBuilderMultipleChoiceField",
    "!doc": "A base class for `A.FormBuilderRadioField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderRadioField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#property_ATTRS"
    },
    "prototype": {
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the radio field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#attribute_predefinedValue"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#attribute_template"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Returns the HTML template.",
      "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#method_getHTML"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderRadioField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderSelectField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderSelectField",
    "!proto": "aui_form_builder.A.FormBuilderMultipleChoiceField",
    "!doc": "A base class for `A.FormBuilderSelectField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderSelectField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#property_ATTRS"
    },
    "prototype": {
     "multiple": {
      "!type": "fn()",
      "!doc": "Checks if the drop-down list allows multiple selections.",
      "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#attribute_multiple"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#attribute_template"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#method_getHTML"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the `A.RadioCellEditor`\nmodel.",
      "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#method_getPropertyModel"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#property_UI_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderSelectField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderTextField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderTextField",
    "!proto": "aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderTextField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderTextField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#property_ATTRS"
    },
    "prototype": {
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#attribute_template"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#attribute_width"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Injects data into the template and returns the HTML result.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#method_getHTML"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the `A.RadioCellEditor`\nmodel.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#method_getPropertyModel"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderTextAreaField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderTextAreaField",
    "!proto": "aui_form_builder.A.FormBuilderTextField",
    "!doc": "A base class for `A.FormBuilderTextAreaField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderTextAreaField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#property_ATTRS"
    },
    "prototype": {
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#attribute_template"
     },
     "getPropertyModel": {
      "!type": "fn()",
      "!doc": "Returns a list of property models including the\n`A.TextAreaCellEditor` model.",
      "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#method_getPropertyModel"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilderTextAreaField.html#property_EXTENDS"
    }
   },
   "A.FormBuilderField": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilderField",
    "!doc": "A base class for `A.FormBuilderField`.",
    "!url": "http://alloyui.com/classes/A.FormBuilderField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilderField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilderField`.",
     "!url": "http://alloyui.com/classes/A.FormBuilderField.html#property_ATTRS"
    },
    "prototype": {
     "acceptChildren": {
      "!type": "fn()",
      "!doc": "If `true` children are accepted.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_acceptChildren"
     },
     "builder": {
      "!type": "fn()",
      "!doc": "The `A.FormBuilder` instance.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_builder"
     },
     "controlsToolbar": {
      "!type": "fn()",
      "!doc": "Collection of toolbar controls.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_controlsToolbar"
     },
     "dataType": {
      "!type": "fn()",
      "!doc": "Indicates which is the type of data for the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_dataType"
     },
     "disabled": {
      "!type": "fn()",
      "!doc": "Checks if the input field is disabled or not.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_disabled"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Checks if the input field is selected or not.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_selected"
     },
     "hiddenAttributes": {
      "!type": "fn()",
      "!doc": "List of hidden attributes.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_hiddenAttributes"
     },
     "id": {
      "!type": "fn()",
      "!doc": "The id of the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_id"
     },
     "label": {
      "!type": "fn()",
      "!doc": "The label of the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_label"
     },
     "localizationMap": {
      "!type": "fn()",
      "!doc": "Collection for content localization.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_localizationMap"
     },
     "name": {
      "!type": "fn()",
      "!doc": "The name of the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_name"
     },
     "parent": {
      "!type": "fn()",
      "!doc": "Container for the field parent.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_parent"
     },
     "predefinedValue": {
      "!type": "fn()",
      "!doc": "Specifies a predefined value for the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_predefinedValue"
     },
     "readOnly": {
      "!type": "fn()",
      "!doc": "Checks if an input field is read-only.\nIn other words, it cannot be modified.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_readOnly"
     },
     "readOnlyAttributes": {
      "!type": "fn()",
      "!doc": "List of read-only input fields.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_readOnlyAttributes"
     },
     "required": {
      "!type": "fn()",
      "!doc": "Checks if an input field is required.\nIn other words, it needs content to be valid.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_required"
     },
     "showLabel": {
      "!type": "fn()",
      "!doc": "If `true` the label is showed.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_showLabel"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_strings"
     },
     "tabIndex": {
      "!type": "fn()",
      "!doc": "Specify the tab order.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_tabIndex"
     },
     "template": {
      "!type": "fn()",
      "!doc": "Reusable block of markup used to generate the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_template"
     },
     "tip": {
      "!type": "fn()",
      "!doc": "Hint to help the user to fill the input field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_tip"
     },
     "type": {
      "!type": "fn()",
      "!doc": "Defines the type of field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_type"
     },
     "unique": {
      "!type": "fn()",
      "!doc": "Checks if the input field is unique or not.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_unique"
     },
     "zIndex": {
      "!type": "fn()",
      "!doc": "Stack order of the field. An element with greater stack order is\nalways in front of an element with a lower stack order.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_zIndex"
     },
     "dropZoneNode": {
      "!type": "fn()",
      "!doc": "Node used to generate the drop zone.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_dropZoneNode"
     },
     "labelNode": {
      "!type": "fn()",
      "!doc": "Node used to generate a label.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_labelNode"
     },
     "requiredFlagNode": {
      "!type": "fn()",
      "!doc": "Node used to generate the required flag.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_requiredFlagNode"
     },
     "templateNode": {
      "!type": "fn()",
      "!doc": "Node used to generate a template.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_templateNode"
     },
     "tipFlagNode": {
      "!type": "fn()",
      "!doc": "Node used to generate a tip.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#attribute_tipFlagNode"
     },
     "createField": {
      "!type": "fn(val) -> +Object",
      "!doc": "Creates the field using the `createField` method from\n`A.FormBuilder`.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_createField"
     },
     "getHTML": {
      "!type": "fn() -> string",
      "!doc": "Gets the field markup.\n\nTo developer: Implement this",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_getHTML"
     },
     "getNode": {
      "!type": "fn() -> +aui_node.Node",
      "!doc": "Creates a `Node` from the HTML string.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_getNode"
     },
     "getAttributesForCloning": {
      "!type": "fn() -> +Object",
      "!doc": "Gets all necessary attributes for cloning this field.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_getAttributesForCloning"
     },
     "getProperties": {
      "!type": "fn() -> +Array",
      "!doc": "Gets properties from the property model.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_getProperties"
     },
     "getPropertyModel": {
      "!type": "fn() -> +Array",
      "!doc": "Returns a list of property models. Each property model is made of a\nname, attribute, editor, and formatter.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method_getPropertyModel"
     },
     "_getToolbarItems": {
      "!type": "fn() -> +Array",
      "!doc": "Gets a list of toolbar items.",
      "!url": "http://alloyui.com/classes/A.FormBuilderField.html#method__getToolbarItems"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderField.html#property_UI_ATTRS"
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.FormBuilderField.html#property_AUGMENTS"
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values have to be parsed from markup.",
     "!url": "http://alloyui.com/classes/A.FormBuilderField.html#property_HTML_PARSER"
    }
   },
   "A.FormBuilder": {
    "!type": "fn(config: Object) -> +aui_form_builder.A.FormBuilder",
    "!proto": "aui_property_builder.A.PropertyBuilder",
    "!doc": "A base class for `A.FormBuilder`.",
    "!url": "http://alloyui.com/classes/A.FormBuilder.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormBuilder`.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_ATTRS"
    },
    "prototype": {
     "allowRemoveRequiredFields": {
      "!type": "fn()",
      "!doc": "Checks if removing required fields is permitted or not.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#attribute_allowRemoveRequiredFields"
     },
     "enableEditing": {
      "!type": "fn()",
      "!doc": "Enables a field to be editable.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#attribute_enableEditing"
     },
     "fieldsSortableListConfig": {
      "!type": "fn()",
      "!doc": "Collection of sortable fields.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#attribute_fieldsSortableListConfig"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#attribute_strings"
     },
     "tabView": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.TabView`.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#attribute_tabView"
     },
     "closeEditProperties": {
      "!type": "fn()",
      "!doc": "Selects the field tab and disables the setting tabs.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_closeEditProperties"
     },
     "createField": {
      "!type": "fn(config) -> +Object",
      "!doc": "Creates a field and returns its configuration.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_createField"
     },
     "duplicateField": {
      "!type": "fn(field)",
      "!doc": "Gets the current field index and then clones the field. Inserts the\nnew one after the current field index, inside of the current field\nparent.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_duplicateField"
     },
     "editField": {
      "!type": "fn(field)",
      "!doc": "Checks if the current field is a `A.FormBuilderField` instance and\nselects it.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_editField"
     },
     "getFieldClass": {
      "!type": "fn(type) -> +Object",
      "!doc": "Gets the field class based on the `A.FormBuilder` type. If the type\ndoesn't exist, logs an error message.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_getFieldClass"
     },
     "getFieldProperties": {
      "!type": "fn(field) -> +Array",
      "!doc": "Gets a list of properties from the field.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_getFieldProperties"
     },
     "insertField": {
      "!type": "fn(field, index, parent)",
      "!doc": "Removes field from previous parent and inserts into the new parent.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_insertField"
     },
     "openEditProperties": {
      "!type": "fn(field)",
      "!doc": "Enables the settings tab.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_openEditProperties"
     },
     "plotField": {
      "!type": "fn(field, container)",
      "!doc": "Renders a field in the container.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_plotField"
     },
     "plotFields": {
      "!type": "fn(fields, container)",
      "!doc": "Renders a list of fields in the container.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_plotFields"
     },
     "selectFields": {
      "!type": "fn(fields)",
      "!doc": "Adds fields to a `A.LinkedSet` instance.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_selectFields"
     },
     "simulateFocusField": {
      "!type": "fn(field)",
      "!doc": "Triggers a focus event in the current field and a blur event in the\nlast focused field.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_simulateFocusField"
     },
     "unselectFields": {
      "!type": "fn(fields)",
      "!doc": "Removes fields from the `A.LinkedSet` instance.",
      "!url": "http://alloyui.com/classes/A.FormBuilder.html#method_unselectFields"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_EXTENDS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_UI_ATTRS"
    },
    "FIELDS_TAB": {
     "!type": "number",
     "!doc": "Static property used to define the fields tab.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_FIELDS_TAB"
    },
    "SETTINGS_TAB": {
     "!type": "number",
     "!doc": "Static property used to define the settings tab.",
     "!url": "http://alloyui.com/classes/A.FormBuilder.html#property_SETTINGS_TAB"
    }
   }
  },
  "aui_form_validator": {
   "A.FormValidator": {
    "!type": "fn(config: Object) -> +aui_form_validator.A.FormValidator",
    "!proto": "Base",
    "!doc": "A base class for `A.FormValidator`.",
    "!url": "http://alloyui.com/classes/A.FormValidator.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.FormValidator.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.FormValidator`.",
     "!url": "http://alloyui.com/classes/A.FormValidator.html#property_ATTRS"
    },
    "prototype": {
     "boundingBox": {
      "!type": "fn()",
      "!doc": "The widget's outermost node, used for sizing and positioning.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_boundingBox"
     },
     "containerErrorClass": {
      "!type": "fn()",
      "!doc": "Container for the CSS error class.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_containerErrorClass"
     },
     "containerValidClass": {
      "!type": "fn()",
      "!doc": "Container for the CSS valid class.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_containerValidClass"
     },
     "errorClass": {
      "!type": "fn()",
      "!doc": "Defines the CSS error class.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_errorClass"
     },
     "extractRules": {
      "!type": "fn()",
      "!doc": "If `true` the validation rules are extracted from the DOM.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_extractRules"
     },
     "fieldContainer": {
      "!type": "fn()",
      "!doc": "Container for a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_fieldContainer"
     },
     "fieldStrings": {
      "!type": "fn()",
      "!doc": "Collection of strings used on a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_fieldStrings"
     },
     "labelCssClass": {
      "!type": "fn()",
      "!doc": "The CSS class for `<label>`.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_labelCssClass"
     },
     "messageContainer": {
      "!type": "fn()",
      "!doc": "Container for the form message.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_messageContainer"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_strings"
     },
     "rules": {
      "!type": "fn()",
      "!doc": "Collection of rules to validate fields.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_rules"
     },
     "selectText": {
      "!type": "fn()",
      "!doc": "Defines if the text will be selected or not after validation.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_selectText"
     },
     "showMessages": {
      "!type": "fn()",
      "!doc": "Defines if the validation messages will be showed or not.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_showMessages"
     },
     "showAllMessages": {
      "!type": "fn()",
      "!doc": "Defines if all validation messages will be showed or not.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_showAllMessages"
     },
     "stackErrorContainer": {
      "!type": "fn()",
      "!doc": "Defines a container for the stack errors.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_stackErrorContainer"
     },
     "validateOnBlur": {
      "!type": "fn()",
      "!doc": "If `true` the field will be validated on blur event.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_validateOnBlur"
     },
     "validateOnInput": {
      "!type": "fn()",
      "!doc": "If `true` the field will be validated on input event.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_validateOnInput"
     },
     "validClass": {
      "!type": "fn()",
      "!doc": "Defines the CSS valid class.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#attribute_validClass"
     },
     "addFieldError": {
      "!type": "fn(field, ruleName)",
      "!doc": "Adds a validation error in the field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_addFieldError"
     },
     "clearFieldError": {
      "!type": "fn(field)",
      "!doc": "Removes a validation error in the field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_clearFieldError"
     },
     "eachRule": {
      "!type": "fn(fn)",
      "!doc": "Executes a function to each rule.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_eachRule"
     },
     "findFieldContainer": {
      "!type": "fn(field) -> +aui_node.Node",
      "!doc": "Gets the ancestor of a given field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_findFieldContainer"
     },
     "focusInvalidField": {
      "!type": "fn()",
      "!doc": "Focus on the invalid field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_focusInvalidField"
     },
     "getField": {
      "!type": "fn(fieldOrFieldName) -> +aui_node.Node",
      "!doc": "Gets a field from the form.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_getField"
     },
     "getFieldsByName": {
      "!type": "fn(fieldName) -> +NodeList",
      "!doc": "Gets a list of fields based on its name.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_getFieldsByName"
     },
     "getFieldError": {
      "!type": "fn(field) -> string",
      "!doc": "Gets a list of fields with errors.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_getFieldError"
     },
     "getFieldStackErrorContainer": {
      "!type": "fn(field)",
      "!doc": "Gets the stack error container of a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_getFieldStackErrorContainer"
     },
     "getFieldErrorMessage": {
      "!type": "fn(field, rule) -> string",
      "!doc": "Gets the error message of a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_getFieldErrorMessage"
     },
     "hasErrors": {
      "!type": "fn() -> bool",
      "!doc": "Returns `true` if there are errors.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_hasErrors"
     },
     "highlight": {
      "!type": "fn(field, valid)",
      "!doc": "Highlights a field with error or success.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_highlight"
     },
     "normalizeRuleValue": {
      "!type": "fn(ruleValue)",
      "!doc": "Normalizes rule value.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_normalizeRuleValue"
     },
     "unhighlight": {
      "!type": "fn(field)",
      "!doc": "Removes the highlight of a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_unhighlight"
     },
     "printStackError": {
      "!type": "fn(field, container, errors)",
      "!doc": "Prints the stack error messages into a container.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_printStackError"
     },
     "resetAllFields": {
      "!type": "fn()",
      "!doc": "Resets the CSS class and content of all fields.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_resetAllFields"
     },
     "resetField": {
      "!type": "fn(field)",
      "!doc": "Resets the CSS class and content of a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_resetField"
     },
     "resetFieldCss": {
      "!type": "fn(field)",
      "!doc": "Removes the CSS classes of a field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_resetFieldCss"
     },
     "validatable": {
      "!type": "fn(field) -> bool",
      "!doc": "Checks if a field can be validated or not.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_validatable"
     },
     "validate": {
      "!type": "fn()",
      "!doc": "Validates all fields.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_validate"
     },
     "validateField": {
      "!type": "fn(field)",
      "!doc": "Validates a single field.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method_validateField"
     },
     "_findFieldLabel": {
      "!type": "fn(field) -> string",
      "!doc": "Finds the label text of a field if existing.",
      "!url": "http://alloyui.com/classes/A.FormValidator.html#method__findFieldLabel"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.FormValidator.html#property_EXTENDS"
    }
   }
  },
  "aui_image_cropper": {
   "A.ImageCropper": {
    "!type": "fn(config: Object) -> +aui_image_cropper.A.ImageCropper",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Image Cropper.\n\nCheck the [live demo](http://alloyui.com/examples/image-cropper/).",
    "!url": "http://alloyui.com/classes/A.ImageCropper.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ImageCropper.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Image Cropper.",
     "!url": "http://alloyui.com/classes/A.ImageCropper.html#property_ATTRS"
    },
    "prototype": {
     "cropHeight": {
      "!type": "fn()",
      "!doc": "The height of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_cropHeight"
     },
     "cropWidth": {
      "!type": "fn()",
      "!doc": "The width of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_cropWidth"
     },
     "minWidth": {
      "!type": "fn()",
      "!doc": "The minimum width of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_minWidth"
     },
     "minHeight": {
      "!type": "fn()",
      "!doc": "The minimum height of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_minHeight"
     },
     "movable": {
      "!type": "fn()",
      "!doc": "Determine if the crop area should move or not.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_movable"
     },
     "preserveRatio": {
      "!type": "fn()",
      "!doc": "Determine if the crop area should preserve the\naspect ratio or not.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_preserveRatio"
     },
     "region": {
      "!type": "fn()",
      "!doc": "Determine the region of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_region"
     },
     "resizable": {
      "!type": "fn()",
      "!doc": "Determine if the crop area should resize or not.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_resizable"
     },
     "x": {
      "!type": "fn()",
      "!doc": "The X position of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_x"
     },
     "y": {
      "!type": "fn()",
      "!doc": "The Y position of a selected area to crop.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#attribute_y"
     },
     "syncImageUI": {
      "!type": "fn()",
      "!doc": "Sync the image on the UI.",
      "!url": "http://alloyui.com/classes/A.ImageCropper.html#method_syncImageUI"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.ImageCropper.html#property_UI_ATTRS"
    }
   }
  },
  "aui_image_viewer_base": {
   "A.ImageViewerBase": {
    "!type": "fn(config: Object) -> +aui_image_viewer_base.A.ImageViewerBase",
    "!proto": "A.Widget",
    "!doc": "The base class for Image Viewer.",
    "!url": "http://alloyui.com/classes/A.ImageViewerBase.html",
    "prototype": {
     "animate": {
      "!type": "fn()",
      "!doc": "Fired when the current image will be animated in.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#event_animate"
     },
     "hasNext": {
      "!type": "fn() -> bool",
      "!doc": "Checks if there is a next element to navigate.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#method_hasNext"
     },
     "hasPrev": {
      "!type": "fn() -> bool",
      "!doc": "Checks if there is a previous element to navigate.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#method_hasPrev"
     },
     "next": {
      "!type": "fn()",
      "!doc": "Loads the next image.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#method_next"
     },
     "prev": {
      "!type": "fn()",
      "!doc": "Loads the previous image.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#method_prev"
     },
     "circular": {
      "!type": "fn()",
      "!doc": "If the image list will be circular or not.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_circular"
     },
     "controlNext": {
      "!type": "fn()",
      "!doc": "The node for the control that shows the next image.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_controlNext"
     },
     "controlPrevious": {
      "!type": "fn()",
      "!doc": "The node for the control that shows the previous image.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_controlPrevious"
     },
     "currentIndex": {
      "!type": "fn()",
      "!doc": "Index of the current image.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_currentIndex"
     },
     "imageAnim": {
      "!type": "fn()",
      "!doc": "Configuration attributes passed to the [Anim](Anim.html) class, or\nfalse if there should be no animation.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_imageAnim"
     },
     "preloadAllImages": {
      "!type": "fn()",
      "!doc": "Preloads the neighbor image (i.e., the previous and next image\nbased on the current load one).",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_preloadAllImages"
     },
     "showControls": {
      "!type": "fn()",
      "!doc": "Shows the controls.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_showControls"
     },
     "sources": {
      "!type": "fn()",
      "!doc": "The source links for the images to be shown.",
      "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#attribute_sources"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration\nfor the `A.ImageViewerBase`.",
     "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#property_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#property_CSS_PREFIX"
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values are to be parsed from\nmarkup contained in the widget's content box.",
     "!url": "http://alloyui.com/classes/A.ImageViewerBase.html#property_HTML_PARSER"
    }
   }
  },
  "aui_media_viewer_plugin": {
   "A.MediaViewerPlugin": {
    "!type": "fn(config: Object) -> +aui_media_viewer_plugin.A.MediaViewerPlugin",
    "!proto": "Plugin.Base",
    "!doc": "A base class for `A.MediaViewerPlugin`.\n\nCheck the [live demo](http://alloyui.com/examples/image-viewer/).",
    "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.MediaViewerPlugin`.",
     "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html#property_ATTRS"
    },
    "prototype": {
     "providers": {
      "!type": "fn()",
      "!doc": "Contains the templates, options and definitions for each provider\n(Flash, Youtube, Vimeo).",
      "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html#attribute_providers"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.MediaViewerPlugin.html#property_EXTENDS"
    }
   }
  },
  "aui_image_viewer_multiple_swipe": {
   "A.ImageViewerMultiple": {
    "!type": "fn(config: Object) -> +aui_image_viewer_multiple.A.ImageViewerMultiple",
    "!proto": "aui_image_viewer_base.A.ImageViewerBase",
    "!doc": "The base class for Image Viewer.",
    "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html",
    "prototype": {
     "useScrollViewPaginator": {
      "!type": "fn()",
      "!doc": "Flag indicating if ScrollViewPaginator should be plugged.",
      "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html#attribute_useScrollViewPaginator"
     }
    }
   }
  },
  "aui_image_viewer_multiple": {
   "A.ImageViewerMultiple": {
    "!type": "fn(config: Object) -> +aui_image_viewer_multiple.A.ImageViewerMultiple",
    "!proto": "aui_image_viewer_base.A.ImageViewerBase",
    "!doc": "The base class for Image Viewer.",
    "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html",
    "prototype": {
     "imageClicked": {
      "!type": "fn()",
      "!doc": "Fired when one of the viewer's images was clicked.",
      "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html#event_imageClicked"
     },
     "makeImageVisible": {
      "!type": "fn()",
      "!doc": "Fired when the widget needs to make an image visible.",
      "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html#event_makeImageVisible"
     },
     "height": {
      "!type": "fn()",
      "!doc": "The height of the image viewer.",
      "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html#attribute_height"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.ImageViewerMultiple.html#property_CSS_PREFIX"
    }
   }
  },
  "aui_image_viewer_slideshow": {
   "A.ImageViewer": {
    "!type": "fn(config: Object) -> +aui_image_viewer.A.ImageViewer",
    "!proto": "Widget",
    "!doc": "A class for `A.ImageViewer`, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Displays an image in a Overlay\n- Keyboard navigation support\n\nCheck the [live demo](http://alloyui.com/examples/image-viewer/).",
    "!url": "http://alloyui.com/classes/A.ImageViewer.html",
    "prototype": {
     "pause": {
      "!type": "fn()",
      "!doc": "Pauses the slideshow.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#method_pause"
     },
     "play": {
      "!type": "fn()",
      "!doc": "Resumes the slideshow.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#method_play"
     },
     "intervalTime": {
      "!type": "fn()",
      "!doc": "Interval time in seconds between an item transition.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_intervalTime"
     },
     "playing": {
      "!type": "fn()",
      "!doc": "True if the slideshow is playing, or false otherwise.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_playing"
     },
     "showPlayer": {
      "!type": "fn()",
      "!doc": "Shows the play button.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_showPlayer"
     }
    }
   }
  },
  "aui_image_viewer_swipe": {
   "A.ImageViewer": {
    "!type": "fn(config: Object) -> +aui_image_viewer.A.ImageViewer",
    "!proto": "Widget",
    "!doc": "A class for `A.ImageViewer`, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Displays an image in a Overlay\n- Keyboard navigation support\n\nCheck the [live demo](http://alloyui.com/examples/image-viewer/).",
    "!url": "http://alloyui.com/classes/A.ImageViewer.html",
    "prototype": {
     "swipe": {
      "!type": "fn()",
      "!doc": "Turns the swipe interaction on/off.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_swipe"
     }
    }
   }
  },
  "aui_image_viewer": {
   "A.ImageViewer": {
    "!type": "fn(config: Object) -> +aui_image_viewer.A.ImageViewer",
    "!proto": "Widget",
    "!doc": "A class for `A.ImageViewer`, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Displays an image in a Overlay\n- Keyboard navigation support\n\nCheck the [live demo](http://alloyui.com/examples/image-viewer/).",
    "!url": "http://alloyui.com/classes/A.ImageViewer.html",
    "prototype": {
     "getLink": {
      "!type": "fn(index) -> +aui_node.Node",
      "!doc": "Gets the `Node` reference to the `index` element from the\n[links](A.ImageViewer.html#attr_links).",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#method_getLink"
     },
     "_getInfoTemplate": {
      "!type": "fn(v: string) -> string",
      "!doc": "Gets the [info](A.ImageViewer.html#attr_info) template.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#method__getInfoTemplate"
     },
     "caption": {
      "!type": "fn()",
      "!doc": "The caption of the displayed image.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_caption"
     },
     "captionFromTitle": {
      "!type": "fn()",
      "!doc": "If `true` the [caption](A.ImageViewer.html#attr_caption) will be\npulled from the title DOM attribute.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_captionFromTitle"
     },
     "centered": {
      "!type": "fn()",
      "!doc": "If `true` the Overlay with the image will be positioned on the\ncenter of the viewport.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_centered"
     },
     "height": {
      "!type": "fn()",
      "!doc": "The height of the image viewer.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_height"
     },
     "infoTemplate": {
      "!type": "fn()",
      "!doc": "String template used to display the information.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_infoTemplate"
     },
     "links": {
      "!type": "fn()",
      "!doc": "Selector or NodeList containing the links where the\n`A.ImageViewer` extracts the information to generate the\nthumbnails.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_links"
     },
     "modal": {
      "!type": "fn()",
      "!doc": "Displays a mask behind the viewer. Set to `false` to disable.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_modal"
     },
     "thumbnailsConfig": {
      "!type": "fn()",
      "!doc": "Configuration options for the thumbnails widget (ImageViewerMultiple).",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_thumbnailsConfig"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Determines if the `A.ImageViewer` should be visible or not.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_visible"
     },
     "width": {
      "!type": "fn()",
      "!doc": "The width of the image viewer.",
      "!url": "http://alloyui.com/classes/A.ImageViewer.html#attribute_width"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration\nfor the `A.ImageViewer`.",
     "!url": "http://alloyui.com/classes/A.ImageViewer.html#property_ATTRS"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.ImageViewer.html#property_CSS_PREFIX"
    }
   }
  },
  "aui_io": {
   "A.IORequest": {
    "!type": "fn(config: Object) -> +aui_io.A.IORequest",
    "!proto": "Plugin.Base",
    "!doc": "A base class for IORequest, providing:\n\n- Response data normalization for XML, JSON, JavaScript\n- Cache options\n\nCheck the [live demo](http://alloyui.com/examples/io/).",
    "!url": "http://alloyui.com/classes/A.IORequest.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.IORequest.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the IORequest.",
     "!url": "http://alloyui.com/classes/A.IORequest.html#property_ATTRS"
    },
    "prototype": {
     "autoLoad": {
      "!type": "fn()",
      "!doc": "If `true` invoke the [start](A.IORequest.html#method_start) method\nautomatically, initializing the IO transaction.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_autoLoad"
     },
     "cache": {
      "!type": "fn()",
      "!doc": "If `false` the current timestamp will be appended to the\nurl, avoiding the url to be cached.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_cache"
     },
     "dataType": {
      "!type": "fn()",
      "!doc": "The type of the request (i.e., could be xml, json, javascript, text).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_dataType"
     },
     "responseData": {
      "!type": "fn()",
      "!doc": "This is a normalized attribute for the response data. It's useful to\nretrieve the correct type for the\n[dataType](A.IORequest.html#attr_dataType) (i.e., in json requests\nthe `responseData`) is a JSONObject.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_responseData"
     },
     "uri": {
      "!type": "fn()",
      "!doc": "URI to be requested using AJAX.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_uri"
     },
     "active": {
      "!type": "fn()",
      "!doc": "Whether the transaction is active or not.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_active"
     },
     "cfg": {
      "!type": "fn()",
      "!doc": "Object containing all the [IO Configuration Attributes](A.io.html).\nThis Object is passed to the `A.io` internally.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_cfg"
     },
     "transaction": {
      "!type": "fn()",
      "!doc": "Stores the IO Object of the current transaction.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_transaction"
     },
     "arguments": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_arguments"
     },
     "context": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_context"
     },
     "data": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_data"
     },
     "form": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_form"
     },
     "headers": {
      "!type": "fn()",
      "!doc": "Set the correct ACCEPT header based on the dataType.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_headers"
     },
     "method": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_method"
     },
     "selector": {
      "!type": "fn()",
      "!doc": "A selector to be used to query against the response of the\nrequest. Only works if the response is XML or HTML.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_selector"
     },
     "sync": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_sync"
     },
     "timeout": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_timeout"
     },
     "xdr": {
      "!type": "fn()",
      "!doc": "See [IO\nConfiguration](http://developer.yahoo.com/yui/3/io/#configuration).",
      "!url": "http://alloyui.com/classes/A.IORequest.html#attribute_xdr"
     },
     "getFormattedData": {
      "!type": "fn() -> string",
      "!doc": "Applies the `YUI.AUI.defaults.io.dataFormatter` if\ndefined and return the formatted data.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#method_getFormattedData"
     },
     "start": {
      "!type": "fn()",
      "!doc": "Starts the IO transaction. Used to refresh the content also.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#method_start"
     },
     "stop": {
      "!type": "fn()",
      "!doc": "Stops the IO transaction.",
      "!url": "http://alloyui.com/classes/A.IORequest.html#method_stop"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.IORequest.html#property_EXTENDS"
    }
   },
   "A.io": {
    "!type": "fn()",
    "!doc": "Alloy IO extension",
    "!url": "http://alloyui.com/classes/A.io.html",
    "prototype": {
     "A.io.request": {
      "!type": "fn(uri: string, config: Object) -> +IORequest",
      "!doc": "Static method to invoke the [IORequest](A.IORequest.html).\nLikewise [IO](A.io.html).",
      "!url": "http://alloyui.com/classes/A.io.html#method_A.io.request"
     }
    }
   }
  },
  "aui_modal_resize": {
   "A.Modal": {
    "!type": "fn(config: Object) -> +aui_modal.A.Modal",
    "!proto": "Widget",
    "!doc": "A base class for Modal.\n\nCheck the [live demo](http://alloyui.com/examples/modal/).",
    "!url": "http://alloyui.com/classes/A.Modal.html",
    "prototype": {
     "resizable": {
      "!type": "fn()",
      "!doc": "Determine if Modal should be resizable or not.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_resizable"
     }
    }
   }
  },
  "aui_modal": {
   "A.Modal": {
    "!type": "fn(config: Object) -> +aui_modal.A.Modal",
    "!proto": "Widget",
    "!doc": "A base class for Modal.\n\nCheck the [live demo](http://alloyui.com/examples/modal/).",
    "!url": "http://alloyui.com/classes/A.Modal.html",
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Modal.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Modal.",
     "!url": "http://alloyui.com/classes/A.Modal.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determine the content of Modal's body section.\n\nTemporary fix for widget-stdmod bug when bodyContent initializes\nempty. this._currFillNode is never updated if _uiSetFillHeight is not\ncalled.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_bodyContent"
     },
     "destroyOnHide": {
      "!type": "fn()",
      "!doc": "Determine if Modal should be destroyed when hidden.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_destroyOnHide"
     },
     "draggable": {
      "!type": "fn()",
      "!doc": "Determine if Modal should be draggable or not.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_draggable"
     },
     "toolbars": {
      "!type": "fn()",
      "!doc": "Determine the content of Modal's header section.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_toolbars"
     },
     "toolbarCssClass": {
      "!type": "fn()",
      "!doc": "Determine the css classes of Modal's sections.",
      "!url": "http://alloyui.com/classes/A.Modal.html#attribute_toolbarCssClass"
     }
    },
    "TEMPLATES": {
     "!type": "+Object",
     "!doc": "Static property provides a set of reusable templates.",
     "!url": "http://alloyui.com/classes/A.Modal.html#property_TEMPLATES"
    }
   }
  },
  "aui_node": {
   "A.Node": {
    "!type": "fn() -> +aui_node.A.Node",
    "!doc": "Augments the [YUI3 Node](Node.html) with more util methods.\n\nCheck the [live demo](http://alloyui.com/examples/node/).",
    "!url": "http://alloyui.com/classes/A.Node.html",
    "prototype": {
     "ancestorsByClassName": {
      "!type": "fn(className: string, testSelf: bool) -> +NodeList",
      "!doc": "Returns the current ancestors of the node element filtered by a\nclassName. This is an optimized method for finding ancestors by a\nspecific CSS class name.\n\nExample:\n\n```\nA.one('#nodeId').ancestorsByClassName('aui-hide');\n```",
      "!url": "http://alloyui.com/classes/A.Node.html#method_ancestorsByClassName"
     },
     "attr": {
      "!type": "fn(name: string, value: string) -> string",
      "!doc": "Gets or sets the value of an attribute for the first element in the set\nof matched elements. If only the `name` is passed it works as a getter.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.attr('title', 'Setting a new title attribute');\n// Alert the value of the title attribute: 'Setting a new title attribute'\nalert( node.attr('title') );\n```",
      "!url": "http://alloyui.com/classes/A.Node.html#method_attr"
     },
     "clone": {
      "!type": "fn() -> +aui_node.Node",
      "!doc": "Normalizes the behavior of cloning a node, which by default should not\nclone the events that are attached to it.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.clone().appendTo('body');\n```",
      "!url": "http://alloyui.com/classes/A.Node.html#method_clone"
     },
     "center": {
      "!type": "fn(val: Array) -> !this",
      "!doc": "Centralizes the current Node instance with the passed `val` Array, Node,\nString, or Region, if not specified, the body will be used.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\n// Center the `node` with the `#container`.\nnode.center('#container');\n```",
      "!url": "http://alloyui.com/classes/A.Node.html#method_center"
     },
     "empty": {
      "!type": "fn() -> !this",
      "!doc": "Removes not only child (and other descendant) elements, but also any text\nwithin the set of matched elements. This is because, according to the DOM\nspecification, any string of text within an element is considered a child\nnode of that element.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.empty();\n```",
      "!url": "http://alloyui.com/classes/A.Node.html#method_empty"
     },
     "getDOM": {
      "!type": "fn() -> +HTMLNode",
      "!doc": "Retrieves the DOM node bound to a Node instance. See\n[getDOMNode](Node.html#method_getDOMNode).",
      "!url": "http://alloyui.com/classes/A.Node.html#method_getDOM"
     },
     "getBorderWidth": {
      "!type": "fn(sides: string) -> number",
      "!doc": "Returns the combined width of the border for the specified sides.",
      "!url": "http://alloyui.com/classes/A.Node.html#method_getBorderWidth"
     }
    }
   },
   "Node": {
    "!type": "fn()",
    "!url": "http://alloyui.com/classes/Node.html",
    "prototype": {
     "getCenterXY": {
      "!type": "fn() -> +Array",
      "!doc": "Gets the current center position of the node in page coordinates.",
      "!url": "http://alloyui.com/classes/Node.html#method_getCenterXY"
     },
     "getMargin": {
      "!type": "fn(sides: string) -> number",
      "!doc": "Returns the combined size of the margin for the specified sides.",
      "!url": "http://alloyui.com/classes/Node.html#method_getMargin"
     },
     "getPadding": {
      "!type": "fn(sides: string) -> number",
      "!doc": "Returns the combined width of the border for the specified sides.",
      "!url": "http://alloyui.com/classes/Node.html#method_getPadding"
     },
     "guid": {
      "!type": "fn() -> string",
      "!doc": "Sets the id of the Node instance if the object does not have one. The\ngenerated id is based on a guid created by the\n[stamp](YUI.html#method_stamp) method.",
      "!url": "http://alloyui.com/classes/Node.html#method_guid"
     },
     "hover": {
      "!type": "fn(overFn: string, outFn: string) -> +aui_node.Node",
      "!doc": "Creates a hover interaction.",
      "!url": "http://alloyui.com/classes/Node.html#method_hover"
     },
     "html": {
      "!type": "fn(value: string)",
      "!doc": "Gets or sets the HTML contents of the node. If the `value` is passed it's\nset the content of the element, otherwise it works as a getter for the\ncurrent content.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.html('Setting new HTML');\n// Alert the value of the current content\nalert( node.html() );\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_html"
     },
     "outerHTML": {
      "!type": "fn() -> string",
      "!doc": "Gets the outerHTML of a node, which islike innerHTML, except that it\nactually contains the HTML of the node itself.",
      "!url": "http://alloyui.com/classes/Node.html#method_outerHTML"
     },
     "placeAfter": {
      "!type": "fn(newNode: aui_node.Node) -> !this",
      "!doc": "Inserts a `newNode` after the node instance (i.e., as the next sibling).\nIf the reference node has no parent, then does nothing.\n\nExample:\n\n```\nvar titleNode = A.one('#titleNode');\nvar descriptionNode = A.one('#descriptionNode');\n// the description is usually shown after the title\ntitleNode.placeAfter(descriptionNode);\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_placeAfter"
     },
     "placeBefore": {
      "!type": "fn(newNode: aui_node.Node) -> !this",
      "!doc": "Inserts a `newNode` before the node instance (i.e., as the previous\nsibling). If the reference node has no parent, then does nothing.\n\nExample:\n\n```\nvar descriptionNode = A.one('#descriptionNode');\nvar titleNode = A.one('#titleNode');\n// the title is usually shown before the description\ndescriptionNode.placeBefore(titleNode);\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_placeBefore"
     },
     "prependTo": {
      "!type": "fn(selector: aui_node.Node) -> !this",
      "!doc": "Inserts the node instance to the begining of the `selector` node (i.e.,\ninsert before the `firstChild` of the `selector`).\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.prependTo('body');\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_prependTo"
     },
     "radioClass": {
      "!type": "fn(cssClass: string) -> !this",
      "!doc": "Adds one or more CSS classes to an element and remove the class(es) from\nthe siblings of the element.",
      "!url": "http://alloyui.com/classes/Node.html#method_radioClass"
     },
     "resetId": {
      "!type": "fn(prefix: string) -> !this",
      "!doc": "Generates an unique identifier and reset the id attribute of the node\ninstance using the new value. Invokes the [guid](Node.html#method_guid).",
      "!url": "http://alloyui.com/classes/Node.html#method_resetId"
     },
     "selectText": {
      "!type": "fn(start: number, end: number)",
      "!doc": "Selects a substring of text inside of the input element.",
      "!url": "http://alloyui.com/classes/Node.html#method_selectText"
     },
     "selectable": {
      "!type": "fn(noRecurse) -> !this",
      "!doc": "Enables text selection for this element (normalized across browsers).",
      "!url": "http://alloyui.com/classes/Node.html#method_selectable"
     },
     "swallowEvent": {
      "!type": "fn(eventName: string, preventDefault: bool) -> !this",
      "!doc": "Stops the specified event(s) from bubbling and optionally prevents the\ndefault action.\n\nExample:\n\n```\nvar anchor = A.one('a#anchorId');\nanchor.swallowEvent('click');\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_swallowEvent"
     },
     "text": {
      "!type": "fn(text: string)",
      "!doc": "Gets or sets the combined text contents of the node instance, including\nit's descendants. If the `text` is passed it's set the content of the\nelement, otherwise it works as a getter for the current content.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.text('Setting new text content');\n// Alert the value of the current content\nalert( node.text() );\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_text"
     },
     "toggle": {
      "!type": "fn(on: bool, callback: fn()) -> !this",
      "!doc": "Displays or hide the node instance.\n\nNOTE: This method assume that your node were hidden because of the\n'aui-hide' css class were being used. This won't manipulate the inline\n`style.display` property.",
      "!url": "http://alloyui.com/classes/Node.html#method_toggle"
     },
     "unselectable": {
      "!type": "fn(noRecurse) -> !this",
      "!doc": "Disables text selection for this element (normalized across browsers).",
      "!url": "http://alloyui.com/classes/Node.html#method_unselectable"
     },
     "val": {
      "!type": "fn(value: string)",
      "!doc": "Gets or sets the value attribute of the node instance. If the `value` is\npassed it's set the value of the element, otherwise it works as a getter\nfor the current value.\n\nExample:\n\n```\nvar input = A.one('#inputId');\ninput.val('Setting new input value');\n// Alert the value of the input\nalert( input.val() );\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_val"
     },
     "width": {
      "!type": "fn() -> number",
      "!doc": "Returns the width of the content, not including the padding, border or\nmargin. If a width is passed, the node's overall width is set to that size.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.width(); //return content width\nnode.width(100); // sets box width\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_width"
     },
     "height": {
      "!type": "fn() -> number",
      "!doc": "Returns the height of the content, not including the padding, border or\nmargin. If a height is passed, the node's overall height is set to that size.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.height(); //return content height\nnode.height(100); // sets box height\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_height"
     },
     "innerWidth": {
      "!type": "fn() -> number",
      "!doc": "Returns the size of the box from inside of the border, which is the\n`offsetWidth` plus the padding on the left and right.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.innerWidth();\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_innerWidth"
     },
     "innerHeight": {
      "!type": "fn() -> number",
      "!doc": "Returns the size of the box from inside of the border, which is offsetHeight\nplus the padding on the top and bottom.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.innerHeight();\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_innerHeight"
     },
     "outerWidth": {
      "!type": "fn() -> number",
      "!doc": "Returns the outer width of the box including the border, if true is passed as\nthe first argument, the margin is included.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.outerWidth();\nnode.outerWidth(true); // includes margin\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_outerWidth"
     },
     "outerHeight": {
      "!type": "fn() -> number",
      "!doc": "Returns the outer height of the box including the border, if true is passed\nas the first argument, the margin is included.\n\nExample:\n\n```\nvar node = A.one('#nodeId');\nnode.outerHeight();\nnode.outerHeight(true); // includes margin\n```",
      "!url": "http://alloyui.com/classes/Node.html#method_outerHeight"
     }
    }
   },
   "A.NodeList": {
    "!type": "fn() -> +aui_node.A.NodeList",
    "!doc": "Augments the [YUI3 NodeList](NodeList.html) with more util methods.\n\nChecks the list of [Methods](NodeList.html#methods) available for AUI\nNodeList.",
    "!url": "http://alloyui.com/classes/A.NodeList.html",
    "prototype": {
     "all": {
      "!type": "fn()",
      "!doc": "See [Node all](Node.html#method_all).",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_all"
     },
     "first": {
      "!type": "fn() -> +aui_node.Node",
      "!doc": "Returns the first element in the node list collection.",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_first"
     },
     "getDOM": {
      "!type": "fn()",
      "!doc": "See [Node getDOMNode](Node.html#method_getDOMNode).",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_getDOM"
     },
     "last": {
      "!type": "fn() -> +aui_node.Node",
      "!doc": "Returns the last element in the node list collection.",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_last"
     },
     "one": {
      "!type": "fn()",
      "!doc": "See [Node one](Node.html#method_one).",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_one"
     },
     "getBody": {
      "!type": "fn()",
      "!doc": "Gets the body node. Shortcut to `A.one('body')`.",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_getBody"
     },
     "getDoc": {
      "!type": "fn()",
      "!doc": "Gets the document node. Shortcut to `A.one(document)`.",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_getDoc"
     },
     "getWin": {
      "!type": "fn()",
      "!doc": "Gets the window node. Shortcut to `A.one(window)`.",
      "!url": "http://alloyui.com/classes/A.NodeList.html#method_getWin"
     }
    }
   },
   "A.HTML5": {
    "!type": "fn()",
    "!doc": "An object that encapsulates util methods for HTML5 shiving.\n\n**What is a \"shiv\"?**\n\nTo the world, a shiv is a slang term for a sharp object used as a\nknife-like weapon. To Internet Explorer, a shiv is a script that, when\nexecuted, forces the browser to recognize HTML5 elements.",
    "!url": "http://alloyui.com/classes/A.HTML5.html",
    "prototype": {
     "onAfterPrint": {
      "!type": "fn()",
      "!doc": "Fires after a print.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_onAfterPrint"
     },
     "onBeforePrint": {
      "!type": "fn()",
      "!doc": "Fires before a print.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_onBeforePrint"
     },
     "parseCSS": {
      "!type": "fn(cssText) -> string",
      "!doc": "Navigates through the CSS joining rules and replacing content.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_parseCSS"
     },
     "restoreHTML": {
      "!type": "fn()",
      "!doc": "Restores the HTML from the `bodyClone` and `bodyEl` attributes.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_restoreHTML"
     },
     "writeHTML": {
      "!type": "fn()",
      "!doc": "Generates the HTML for print.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_writeHTML"
     },
     "IECreateFix": {
      "!type": "fn(frag: aui_node.Node, content: string) -> +aui_node.Node",
      "!doc": "Receives a `frag` and a HTML content. This method shivs the HTML5\nnodes appended to a Node or fragment which is not on the document\nyet.",
      "!url": "http://alloyui.com/classes/A.HTML5.html#method_IECreateFix"
     }
    }
   }
  },
  "aui_pagination": {
   "A.Pagination": {
    "!type": "fn(config: Object) -> +aui_pagination.A.Pagination",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Pagination, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Set of controls to navigate through paged data\n\nCheck the [live demo](http://alloyui.com/examples/pagination/).",
    "!url": "http://alloyui.com/classes/A.Pagination.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Pagination.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for\nthe `A.Pagination`.",
     "!url": "http://alloyui.com/classes/A.Pagination.html#property_ATTRS"
    },
    "prototype": {
     "circular": {
      "!type": "fn()",
      "!doc": "When enabled this property allows the navigation to go back to the\nbeggining when it reaches the last page, the opposite behavior is\nalso true. Incremental page navigation could happen clicking the\ncontrol arrows or invoking `.next()` and `.prev()` methods.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_circular"
     },
     "formatter": {
      "!type": "fn()",
      "!doc": "A formatter function to format each pagination item.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_formatter"
     },
     "items": {
      "!type": "fn()",
      "!doc": "Holds the page items as a `NodeList`. The list could be queried from\nthe DOM trough Widget `HTML_PARSER` or generated if\n[total](A.Pagination.html#attr_total) is specified.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_items"
     },
     "offset": {
      "!type": "fn()",
      "!doc": "Initial page offset.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_offset"
     },
     "page": {
      "!type": "fn()",
      "!doc": "Determines if pagination controls (Next and Prev) are rendered.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_page"
     },
     "total": {
      "!type": "fn()",
      "!doc": "Total number of page links available. If set, the new\n[items](A.Pagination.html#attr_items) node list will be rendered.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_total"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#attribute_strings"
     },
     "getItem": {
      "!type": "fn(i: aui_node.Node) -> +aui_node.Node",
      "!doc": "Retrieve the item node from the passesed item index parameter.\nIf passed item is a node instead of the index returns itself.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_getItem"
     },
     "getOffsetPageNumber": {
      "!type": "fn() -> number",
      "!doc": "Retrieve page number including offset e.g., if offset is 100 and\nactive page is 5, this method returns 105.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_getOffsetPageNumber"
     },
     "getOffsetTotalPages": {
      "!type": "fn() -> number",
      "!doc": "Retrieve total number of pages including offset e.g., if offset is\n100 and total 10, this method returns 110.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_getOffsetTotalPages"
     },
     "getTotalItems": {
      "!type": "fn() -> number",
      "!doc": "Retrieve total number of dom items representing the links, including\nthe arrow control items. Do not include the offset.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_getTotalItems"
     },
     "next": {
      "!type": "fn()",
      "!doc": "Navigate to the next page.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_next"
     },
     "prev": {
      "!type": "fn()",
      "!doc": "Navigate to the previous page.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_prev"
     },
     "setState": {
      "!type": "fn(state: Object)",
      "!doc": "Set the new pagination state. The state is a payload object\ncontaining the page number, e.g. `{page:1}`.",
      "!url": "http://alloyui.com/classes/A.Pagination.html#method_setState"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values are to be parsed from markup\ncontained in the widget's content box.",
     "!url": "http://alloyui.com/classes/A.Pagination.html#property_HTML_PARSER"
    },
    "BIND_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes for the bindUI lifecycle\nphase.",
     "!url": "http://alloyui.com/classes/A.Pagination.html#property_BIND_UI_ATTRS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.Pagination.html#property_UI_ATTRS"
    }
   }
  },
  "aui_palette": {
   "A.Palette": {
    "!type": "fn(config: Object) -> +aui_palette.A.Palette",
    "!proto": "Widget",
    "!doc": "A base class for Palette.",
    "!url": "http://alloyui.com/classes/A.Palette.html",
    "prototype": {
     "getItem": {
      "!type": "fn(row: number, col: number) -> +Object",
      "!doc": "Returns an item in the Palette by row and column.",
      "!url": "http://alloyui.com/classes/A.Palette.html#method_getItem"
     },
     "getItemByIndex": {
      "!type": "fn(index: number) -> +Object",
      "!doc": "Returns an item in the Palette by its index.",
      "!url": "http://alloyui.com/classes/A.Palette.html#method_getItemByIndex"
     },
     "getItemByValue": {
      "!type": "fn(value: Object) -> +Object",
      "!doc": "Returns an item in the Palette by its value.",
      "!url": "http://alloyui.com/classes/A.Palette.html#method_getItemByValue"
     },
     "select": {
      "!type": "fn(valueOrIndex: number)",
      "!doc": "Selects an item in the Palette.",
      "!url": "http://alloyui.com/classes/A.Palette.html#method_select"
     },
     "toggleSelection": {
      "!type": "fn()",
      "!doc": "If true, on user interaction if the user clicks on an already\nselected element, it will be unselected.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_toggleSelection"
     },
     "unselect": {
      "!type": "fn(valueOrIndex: number)",
      "!doc": "Unselects an item. The item must be specified by its value or index.",
      "!url": "http://alloyui.com/classes/A.Palette.html#method_unselect"
     },
     "columns": {
      "!type": "fn()",
      "!doc": "Specifies how many columns should contain the Palette. If the\nvalue is a positive number, the Palette will generate as many\ncolumns as specified in this property and it will fit the\nprovided `items` in these columns.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_columns"
     },
     "containerNode": {
      "!type": "fn()",
      "!doc": "Container node of the palette. If found, palette widget will not\ngenerate content.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_containerNode"
     },
     "formatter": {
      "!type": "fn()",
      "!doc": "Provides a function, which will be used to format the content\nduring Palette creation.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_formatter"
     },
     "items": {
      "!type": "fn()",
      "!doc": "An array of Palette items. These items will be rendered in the\nPalette according to the specified `columns`.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_items"
     },
     "selected": {
      "!type": "fn()",
      "!doc": "Provides the index of currently selected item.",
      "!url": "http://alloyui.com/classes/A.Palette.html#attribute_selected"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values have to be parsed from\nmarkup contained in the Palette's content box.",
     "!url": "http://alloyui.com/classes/A.Palette.html#property_HTML_PARSER"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Palette.",
     "!url": "http://alloyui.com/classes/A.Palette.html#property_ATTRS"
    }
   }
  },
  "aui_parse_content": {
   "A.ParseContent": {
    "!type": "fn(config: Object) -> +aui_parse_content.A.ParseContent",
    "!proto": "Plugin.Base",
    "!doc": "A base class for ParseContent, providing:\n\n- After plug ParseContent on a A.Node instance the javascript chunks will be\n  executed (remote and inline scripts)\n- All the javascripts within a content will be executed according to the\n  order of apparition\n\n**NOTE:** For performance reasons on DOM manipulation,\nParseContent only parses the content passed to the\n[setContent](Node.html#method_setContent),\n[prepend](Node.html#method_prepend) and\n[append](Node.html#method_append) methods.\n\nQuick Example:\n\n```\nnode.plug(A.Plugin.ParseContent);\n```",
    "!url": "http://alloyui.com/classes/A.ParseContent.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ParseContent.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.ParseContent.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the ParseContent.",
     "!url": "http://alloyui.com/classes/A.ParseContent.html#property_ATTRS"
    },
    "prototype": {
     "queue": {
      "!type": "fn()",
      "!doc": "A queue of elements to be parsed.",
      "!url": "http://alloyui.com/classes/A.ParseContent.html#attribute_queue"
     },
     "preserveScriptNodes": {
      "!type": "fn()",
      "!doc": "When true, script nodes will not be removed from original content,\ninstead the script type attribute will be set to `text/plain`.",
      "!url": "http://alloyui.com/classes/A.ParseContent.html#attribute_preserveScriptNodes"
     },
     "globalEval": {
      "!type": "fn(data: string)",
      "!doc": "Global eval the <data>data</data> passed.",
      "!url": "http://alloyui.com/classes/A.ParseContent.html#method_globalEval"
     },
     "parseContent": {
      "!type": "fn(content: string) -> string",
      "!doc": "Extract the `script` tags from the string content and\nevaluate the chunks.",
      "!url": "http://alloyui.com/classes/A.ParseContent.html#method_parseContent"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.ParseContent.html#property_EXTENDS"
    }
   }
  },
  "aui_popover": {
   "A.Popover": {
    "!type": "fn(config: Object) -> +aui_popover.A.Popover",
    "!proto": "Widget",
    "!doc": "A base class for Popover.\n\nCheck the [live demo](http://alloyui.com/examples/popover/).",
    "!url": "http://alloyui.com/classes/A.Popover.html",
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Popover.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Popover.",
     "!url": "http://alloyui.com/classes/A.Popover.html#property_ATTRS"
    },
    "prototype": {
     "triggerToggleEvent": {
      "!type": "fn()",
      "!doc": "DOM event to hide the tooltip.",
      "!url": "http://alloyui.com/classes/A.Popover.html#attribute_triggerToggleEvent"
     }
    },
    "TEMPLATES": {
     "!type": "+Object",
     "!doc": "Static property provides a set of reusable templates.",
     "!url": "http://alloyui.com/classes/A.Popover.html#property_TEMPLATES"
    }
   }
  },
  "aui_progressbar": {
   "A.ProgressBar": {
    "!type": "fn(config: Object) -> +aui_progressbar.A.ProgressBar",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Progressbar, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- A visual means of showing progress of an ongoing operation\n- Can be enhanced via CSS styles to provide different colors, shapes and\n  textures\n- The bar can move horizontally or vertically\n- The movement can be enhanced by using the Animation utility\n\nCheck the [live demo](http://alloyui.com/examples/progress-bar/).",
    "!url": "http://alloyui.com/classes/A.ProgressBar.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ProgressBar.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the ProgressBar.",
     "!url": "http://alloyui.com/classes/A.ProgressBar.html#property_ATTRS"
    },
    "prototype": {
     "useARIA": {
      "!type": "fn()",
      "!doc": "Boolean indicating if use of the WAI-ARIA Roles and States\nshould be enabled.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_useARIA"
     },
     "height": {
      "!type": "fn()",
      "!doc": "Display height of the progressbar.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_height"
     },
     "label": {
      "!type": "fn()",
      "!doc": "Display label of the progressbar. If not specified try to query\nusing HTML_PARSER an element inside boundingBox which matches\n`aui-progressbar-text` and get its innerHTML to be\nused as label.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_label"
     },
     "max": {
      "!type": "fn()",
      "!doc": "Represents the top value for the bar. The bar will be fully\nextended when reaching this value. Values higher than this will\nbe ignored.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_max"
     },
     "min": {
      "!type": "fn()",
      "!doc": "Represents the lowest value for the bar. The bar will be\ntotally collapsed when reaching this value. Values lower than\nthis will be ignored.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_min"
     },
     "orientation": {
      "!type": "fn()",
      "!doc": "Display orientation of the progressbar (i.e. vertical or\nhorizontal).",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_orientation"
     },
     "ratio": {
      "!type": "fn()",
      "!doc": "Calculate the ratio based on `max` and `min` values.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_ratio"
     },
     "step": {
      "!type": "fn()",
      "!doc": "Calculate the progressbar step based on `ratio` value.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_step"
     },
     "textNode": {
      "!type": "fn()",
      "!doc": "DOM Node to display the text of the progressbar. If not\nspecified try to query using HTML_PARSER an element inside\ncontentBox which matches `aui-progressbar-text`.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_textNode"
     },
     "value": {
      "!type": "fn()",
      "!doc": "The value for the bar. Valid values are in between the minValue\nand maxValue attributes.",
      "!url": "http://alloyui.com/classes/A.ProgressBar.html#attribute_value"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values are to be parsed from\nmarkup contained in the widget's bounding box.",
     "!url": "http://alloyui.com/classes/A.ProgressBar.html#property_HTML_PARSER"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.ProgressBar.html#property_UI_ATTRS"
    }
   }
  },
  "aui_promise": {
   "A.CancellablePromise": {
    "!type": "fn(fn: fn(), opt_errorCallback: fn()) -> +aui_promise.A.CancellablePromise",
    "!proto": "{Promise}",
    "!doc": "Cancellable promise.",
    "!url": "http://alloyui.com/classes/A.CancellablePromise.html",
    "prototype": {
     "thenAways": {
      "!type": "fn(callback: fn()) -> +Promise",
      "!doc": "Adds a callback that will be invoked whether the Promise is fulfilled or\nrejected. The callback receives no argument, and a new child Promise is\ncreated. This is useful for ensuring that cleanup takes place after certain\nasynchronous operations. Callbacks added with `thenAlways` will be executed\nin the same order with other calls to `then`, `thenAlways`.",
      "!url": "http://alloyui.com/classes/A.CancellablePromise.html#method_thenAways"
     },
     "thenCatch": {
      "!type": "fn(callback: fn()) -> +Promise",
      "!doc": "Adds a callback that will be invoked only if the Promise is rejected. This is\nequivalent to `then(null, onRejected)`.",
      "!url": "http://alloyui.com/classes/A.CancellablePromise.html#method_thenCatch"
     },
     "cancel": {
      "!type": "fn(opt_message: string)",
      "!doc": "Cancels the Promise by rejecting it with a `A.CancellablePromise.Error`. No\naction is performed if the Promise is already resolved.",
      "!url": "http://alloyui.com/classes/A.CancellablePromise.html#method_cancel"
     },
     "undefined": {
      "!type": "fn()",
      "!url": "http://alloyui.com/classes/A.CancellablePromise.html"
     }
    }
   },
   "A.PropertyBuilderAvailableField": {
    "!type": "fn(config: Object) -> +aui_promise.A.PropertyBuilderAvailableField",
    "!proto": "Base",
    "!doc": "A base class for PropertyBuilderAvailableField.",
    "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.PropertyBuilderAvailableField`.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#property_ATTRS"
    },
    "prototype": {
     "draggable": {
      "!type": "fn()",
      "!doc": "Defines if the field is draggable or not.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_draggable"
     },
     "label": {
      "!type": "fn()",
      "!doc": "The descriptor of a field.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_label"
     },
     "iconClass": {
      "!type": "fn()",
      "!doc": "The CSS class name used in the icon.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_iconClass"
     },
     "id": {
      "!type": "fn()",
      "!doc": "The identifier of a field.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_id"
     },
     "node": {
      "!type": "fn()",
      "!doc": "The node used in a field.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_node"
     },
     "type": {
      "!type": "fn()",
      "!doc": "The type of a field.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#attribute_type"
     }
    },
    "EXTENDS": {
     "!type": "string",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderAvailableField.html#property_EXTENDS"
    }
   },
   "A.PropertyBuilderFieldSupport": {
    "!type": "fn() -> +aui_promise.A.PropertyBuilderFieldSupport",
    "!doc": "A base class for `A.PropertyBuilderFieldSupport`.",
    "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.PropertyBuilderFieldSupport`.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#property_ATTRS"
    },
    "prototype": {
     "fields": {
      "!type": "fn()",
      "!doc": "The collection of fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#attribute_fields"
     },
     "maxFields": {
      "!type": "fn()",
      "!doc": "Defines the maximum number of fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#attribute_maxFields"
     },
     "addField": {
      "!type": "fn(field, index)",
      "!doc": "Adds a single field in the field list.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#method_addField"
     },
     "createFields": {
      "!type": "fn(val) -> +A.ArrayList",
      "!doc": "Creates a collection of fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#method_createFields"
     },
     "removeField": {
      "!type": "fn(field)",
      "!doc": "Removes a single field from the field list.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#method_removeField"
     },
     "createField": {
      "!type": "fn(val)",
      "!doc": "Creates a single field.\n\nNOTE FOR DEVELOPERS: Yoy must implement this method.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderFieldSupport.html#method_createField"
     }
    }
   },
   "A.PropertyBuilderSettings": {
    "!type": "fn() -> +aui_promise.A.PropertyBuilderSettings",
    "!doc": "A base class for `A.PropertyBuilderSettings`.",
    "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.PropertyBuilderSettings`.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#property_ATTRS"
    },
    "prototype": {
     "propertyList": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.PropertyList`.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#attribute_propertyList"
     },
     "tabView": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.TabView`.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#attribute_tabView"
     },
     "toolbar": {
      "!type": "fn()",
      "!doc": "Stores an instance of `A.Toolbar`.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#attribute_toolbar"
     },
     "toolbarContainer": {
      "!type": "fn()",
      "!doc": "Host node for toolbar created using the `TOOLBAR_CONTAINER_TEMPLATE`\ntemplate.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#attribute_toolbarContainer"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values have to be parsed from markup.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilderSettings.html#property_HTML_PARSER"
    }
   }
  },
  "aui_property_builder": {
   "A.PropertyBuilder": {
    "!type": "fn(config: Object) -> +aui_property_builder.A.PropertyBuilder",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for PropertyBuilder.",
    "!url": "http://alloyui.com/classes/A.PropertyBuilder.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.PropertyBuilder`.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#property_ATTRS"
    },
    "prototype": {
     "availableFields": {
      "!type": "fn()",
      "!doc": "List of available fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_availableFields"
     },
     "availableFieldsDragConfig": {
      "!type": "fn()",
      "!doc": "The configuration object for draggable available fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_availableFieldsDragConfig"
     },
     "canvas": {
      "!type": "fn()",
      "!doc": "A node created using the `CANVAS_TEMPLATE` template.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_canvas"
     },
     "dropConfig": {
      "!type": "fn()",
      "!doc": "The configuration object for drop container node.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_dropConfig"
     },
     "contentContainer": {
      "!type": "fn()",
      "!doc": "Host node for content created using the `CONTENT_CONTAINER_TEMPLATE`\ntemplate.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_contentContainer"
     },
     "dropContainer": {
      "!type": "fn()",
      "!doc": "Host node for drop created using the `DROP_CONTAINER_TEMPLATE`\ntemplate.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_dropContainer"
     },
     "fieldsContainer": {
      "!type": "fn()",
      "!doc": "Host node for fields created using the `FIELDS_CONTAINER_TEMPLATE`\ntemplate.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#attribute_fieldsContainer"
     },
     "isAvailableFieldsDrag": {
      "!type": "fn(drag) -> bool",
      "!doc": "Checks if the `availableFields` are draggable.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#method_isAvailableFieldsDrag"
     },
     "plotFields": {
      "!type": "fn()",
      "!doc": "Plots a collection of fields.",
      "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#method_plotFields"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values have to be parsed from markup.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#property_HTML_PARSER"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#property_UI_ATTRS"
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.PropertyBuilder.html#property_AUGMENTS"
    }
   }
  },
  "aui_rating": {
   "A.Rating": {
    "!type": "fn(config: Object) -> +aui_rating.A.Rating",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Rating, providing:\n\n- A non-obstrusive star rating control\n- Could be based on a set of radio input boxes\n\nCheck the [live demo](http://alloyui.com/examples/rating/).",
    "!url": "http://alloyui.com/classes/A.Rating.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Rating.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Rating.",
     "!url": "http://alloyui.com/classes/A.Rating.html#property_ATTRS"
    },
    "prototype": {
     "disabled": {
      "!type": "fn()",
      "!doc": "Whether the Rating is disabled or not.\nDisabled Ratings don't allow hover or click,\njust display selected stars.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_disabled"
     },
     "canReset": {
      "!type": "fn()",
      "!doc": "If `true` could be reseted\n(i.e., have no values selected).",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_canReset"
     },
     "cssClasses": {
      "!type": "fn()",
      "!doc": "CSS classes applied on Rating.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_cssClasses"
     },
     "defaultSelected": {
      "!type": "fn()",
      "!doc": "The number of selected starts when the Rating render.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_defaultSelected"
     },
     "elements": {
      "!type": "fn()",
      "!doc": "[NodeList](NodeList.html) of elements used on the\nRating. Each element is one Star.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_elements"
     },
     "hiddenInput": {
      "!type": "fn()",
      "!doc": "Hidden input to handle the selected value. This hidden input\nreplace the radio elements and keep the same name.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_hiddenInput"
     },
     "inputName": {
      "!type": "fn()",
      "!doc": "Name of the [hiddenInput](A.Rating.html#attr_hiddenInput) element. If\nnot specified will use the name of the replaced radio.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_inputName"
     },
     "label": {
      "!type": "fn()",
      "!doc": "Label to be displayed with the Rating elements.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_label"
     },
     "labelNode": {
      "!type": "fn()",
      "!doc": "DOM Node to display the text of the StarRating. If not\nspecified try to query using HTML_PARSER an element inside\nboundingBox which matches `aui-rating-label-element`.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_labelNode"
     },
     "selectedIndex": {
      "!type": "fn()",
      "!doc": "Stores the index of the selected element.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_selectedIndex"
     },
     "showTitle": {
      "!type": "fn()",
      "!doc": "If `true` will extract the value of the\n`title` attribute on the radio, and use it on the\ngenerated Rating elements.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_showTitle"
     },
     "size": {
      "!type": "fn()",
      "!doc": "Number of Rating elements to be displayed.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_size"
     },
     "title": {
      "!type": "fn()",
      "!doc": "If set, will be used when there is no DOM `title` on the\nradio elements.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_title"
     },
     "value": {
      "!type": "fn()",
      "!doc": "Stores the value of the current selected Rating element.",
      "!url": "http://alloyui.com/classes/A.Rating.html#attribute_value"
     },
     "clearSelection": {
      "!type": "fn()",
      "!doc": "Clear all selected starts to the default state.",
      "!url": "http://alloyui.com/classes/A.Rating.html#method_clearSelection"
     },
     "select": {
      "!type": "fn(index: number)",
      "!doc": "Select the `index` Rating element.",
      "!url": "http://alloyui.com/classes/A.Rating.html#method_select"
     },
     "fillTo": {
      "!type": "fn(index: number, className: string)",
      "!doc": "Add the `className` on the the `index` element\nand all the previous Rating elements.",
      "!url": "http://alloyui.com/classes/A.Rating.html#method_fillTo"
     },
     "indexOf": {
      "!type": "fn(elem: aui_node.Node) -> number",
      "!doc": "Find the index of the `elem`.",
      "!url": "http://alloyui.com/classes/A.Rating.html#method_indexOf"
     },
     "itemClick": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Handle the itemClick event.",
      "!url": "http://alloyui.com/classes/A.Rating.html#event_itemClick"
     },
     "itemSelect": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Handle the itemOver event.",
      "!url": "http://alloyui.com/classes/A.Rating.html#event_itemSelect"
     },
     "itemOut": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Handle the itemOut event.",
      "!url": "http://alloyui.com/classes/A.Rating.html#event_itemOut"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Object hash, defining how attribute values are to be parsed from\nmarkup contained in the widget's content box.",
     "!url": "http://alloyui.com/classes/A.Rating.html#property_HTML_PARSER"
    }
   },
   "A.ThumbRating": {
    "!type": "fn(config: Object) -> +aui_rating.A.ThumbRating",
    "!proto": "aui_rating.A.Rating",
    "!doc": "A base class for ThumbRating, providing:\n\n- A non-obstrusive star rating control using Thumb up and Thumb down icons\n- Could be based on a set of radio input boxes\n\nCheck the [live demo](http://alloyui.com/examples/rating/).",
    "!url": "http://alloyui.com/classes/A.ThumbRating.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.ThumbRating.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the ThumbRating.",
     "!url": "http://alloyui.com/classes/A.ThumbRating.html#property_ATTRS"
    },
    "prototype": {
     "cssClasses": {
      "!type": "fn()",
      "!doc": "CSS classes applied on ThumbRating.",
      "!url": "http://alloyui.com/classes/A.ThumbRating.html#attribute_cssClasses"
     },
     "size": {
      "!type": "fn()",
      "!doc": "The size on ThumbRating is always 2 (i.e., thumb up and thumb down).",
      "!url": "http://alloyui.com/classes/A.ThumbRating.html#attribute_size"
     },
     "fillTo": {
      "!type": "fn(index: number, className: string)",
      "!doc": "Add the `className` on the the `index` element\nand all the previous Rating elements.",
      "!url": "http://alloyui.com/classes/A.ThumbRating.html#method_fillTo"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.ThumbRating.html#property_EXTENDS"
    }
   }
  },
  "aui_scheduler": {
   "A.SchedulerCalendar": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerCalendar",
    "!proto": "ModelList",
    "!doc": "A base class for `SchedulerCalendar`.",
    "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerCalendar`.",
     "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#property_ATTRS"
    },
    "prototype": {
     "color": {
      "!type": "fn()",
      "!doc": "Contains the `color` of the scheduler calendar.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_color"
     },
     "disabled": {
      "!type": "fn()",
      "!doc": "Determines if the calender is enabled.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_disabled"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this calendar.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_name"
     },
     "palette": {
      "!type": "fn()",
      "!doc": "Contains a list of colors for the calendar.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_palette"
     },
     "scheduler": {
      "!type": "fn()",
      "!doc": "Contains this `SchedulerCalendar`'s `SchedulerBase' object.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_scheduler"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Indicates whether the calendar is visible.",
      "!url": "http://alloyui.com/classes/A.SchedulerCalendar.html#attribute_visible"
     }
    }
   },
   "A.SchedulerEvent": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerEvent",
    "!proto": "Model",
    "!doc": "A base class for `SchedulerEvent`.",
    "!url": "http://alloyui.com/classes/A.SchedulerEvent.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerEvent`.",
     "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#property_ATTRS"
    },
    "prototype": {
     "allDay": {
      "!type": "fn()",
      "!doc": "Determines whether a new event will take place all day. When enabled,\nthe event will not contain 24-hour clock date inputs.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_allDay"
     },
     "borderColor": {
      "!type": "fn()",
      "!doc": "Determines the CSS border color of a calendar event.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_borderColor"
     },
     "borderStyle": {
      "!type": "fn()",
      "!doc": "Determines the CSS border style of a calendar event.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_borderStyle"
     },
     "borderWidth": {
      "!type": "fn()",
      "!doc": "Determines the CSS border width of a calendar event.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_borderWidth"
     },
     "content": {
      "!type": "fn()",
      "!doc": "Contains the content of Scheduler event's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_content"
     },
     "color": {
      "!type": "fn()",
      "!doc": "Contains the `color` of a calendar event.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_color"
     },
     "colorBrightnessFactor": {
      "!type": "fn()",
      "!doc": "Contains the color brightness factor is applied to the `color`\nattribute.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_colorBrightnessFactor"
     },
     "colorSaturationFactor": {
      "!type": "fn()",
      "!doc": "Contains the color saturation factor is applied to the `color`\nattribute.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_colorSaturationFactor"
     },
     "titleDateFormat": {
      "!type": "fn()",
      "!doc": "Contains the formatted title date for this scheduler event, taking\ninto account ISO time. The value will not contain an `endDate` if\nthis event is `allDay`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_titleDateFormat"
     },
     "endDate": {
      "!type": "fn()",
      "!doc": "Contains the date corresponding to the current ending date of a\nscheduled event. By default, the value is one hour after the\n`startDate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_endDate"
     },
     "disabled": {
      "!type": "fn()",
      "!doc": "Determines if the event is disabled.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_disabled"
     },
     "meeting": {
      "!type": "fn()",
      "!doc": "Determines if the event is a meeting.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_meeting"
     },
     "node": {
      "!type": "fn()",
      "!doc": "Contains the event `NodeList`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_node"
     },
     "reminder": {
      "!type": "fn()",
      "!doc": "Determines if the event is requires reminder.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_reminder"
     },
     "repeated": {
      "!type": "fn()",
      "!doc": "Determines if the event is to be repeated.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_repeated"
     },
     "scheduler": {
      "!type": "fn()",
      "!doc": "Contains this `SchedulerEvent`'s `SchedulerBase' object.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_scheduler"
     },
     "startDate": {
      "!type": "fn()",
      "!doc": "Contains the date corresponding to the current starting date of a\nscheduled event. By default, the value is the date set on the user's\ncomputer.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_startDate"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Indicates whether the event is visible.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#attribute_visible"
     },
     "addPaddingNode": {
      "!type": "fn()",
      "!doc": "Sometimes an event will require a padding node that mimics the\nbehavior of the scheduler `event`'s `node`. This can occur in the\nweek view when an event spans multiple days.\n\nFor example, an event beginning at 10pm on January 1 and ending on\n3am January 2nd would require a padding node. The `event`'s `node`\nappears from January 1 from 10:00pm to 11:59pm and the `paddingNode`\nis rendered on the table from January 2 from 12:00am to 3:00am.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_addPaddingNode"
     },
     "clone": {
      "!type": "fn() -> +Object",
      "!doc": "Clones the scheduler `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_clone"
     },
     "copyDates": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent, options: Object)",
      "!doc": "Copies the dates from the `event` parameter to the instance `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_copyDates"
     },
     "copyPropagateAttrValues": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent, dontCopyMap: bool, options: Object)",
      "!doc": "Copies the propagate attribute vales from an `event` to this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_copyPropagateAttrValues"
     },
     "getDaysDuration": {
      "!type": "fn() -> number",
      "!doc": "Gets the number of days an `event` is scheduled to take place.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getDaysDuration"
     },
     "getHoursDuration": {
      "!type": "fn() -> number",
      "!doc": "Gets the number of hours an `event` is scheduled to take place.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getHoursDuration"
     },
     "getMinutesDuration": {
      "!type": "fn() -> number",
      "!doc": "Gets the number of minutes an `event` is scheduled to take place.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getMinutesDuration"
     },
     "getSecondsDuration": {
      "!type": "fn() -> number",
      "!doc": "Gets the number of seconds an `event` is scheduled to take place.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getSecondsDuration"
     },
     "sameEndDate": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event`'s end date is this same as this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_sameEndDate"
     },
     "sameStartDate": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event`'s start date is this same as this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_sameStartDate"
     },
     "isAfter": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event` is after this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_isAfter"
     },
     "isBefore": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event` is before this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_isBefore"
     },
     "intersects": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event` interescts with this `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_intersects"
     },
     "intersectHours": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent) -> bool",
      "!doc": "Determines if an `event`'s hours' interescts with this `event`'s\nhours.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_intersectHours"
     },
     "isDayBoundaryEvent": {
      "!type": "fn() -> bool",
      "!doc": "Determines if a this `event` starts or ends at the beginning or end\nof a day.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_isDayBoundaryEvent"
     },
     "isDayOverlapEvent": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the passed date is between `startDate` and `endDate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_isDayOverlapEvent"
     },
     "getClearEndDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Clears the time fields from the `endDate`, effectively setting the\ntime to 12 noon.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getClearEndDate"
     },
     "getClearStartDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Clears the time fields from the `startDate`, effectively setting the\ntime to 12 noon.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_getClearStartDate"
     },
     "move": {
      "!type": "fn(date: aui_datatype_date_parse.Date, options: Object)",
      "!doc": "Moves this Scheduler event to a new date specified by the date\nparameter.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_move"
     },
     "setContent": {
      "!type": "fn(content)",
      "!doc": "Replaces each node's current content with the `content`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_setContent"
     },
     "setTitle": {
      "!type": "fn(content)",
      "!doc": "Replaces each node's current title with the `content`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_setTitle"
     },
     "syncNodeContentUI": {
      "!type": "fn()",
      "!doc": "Sets the content of the Scheduler event to the content attribute\nvalue.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_syncNodeContentUI"
     },
     "syncNodeTitleUI": {
      "!type": "fn()",
      "!doc": "Sets the title of the Scheduler event to the a formated date.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_syncNodeTitleUI"
     },
     "split": {
      "!type": "fn() -> +Array",
      "!doc": "Splits an event into multiple days. Since an event can span across\nmultiple days in the week view, this event will be split into chunks\nfor each day column.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#method_split"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#property_EXTENDS"
    },
    "PROPAGATE_ATTRS": {
     "!type": "+Array",
     "!doc": "Defines the propegate attribute keys for `Scheduler` events.",
     "!url": "http://alloyui.com/classes/A.SchedulerEvent.html#property_PROPAGATE_ATTRS"
    }
   },
   "A.SchedulerView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerView",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for `SchedulerView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerView.html#property_NAME"
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.SchedulerView.html#property_AUGMENTS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerView.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determines the content of Scheduler view's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_bodyContent"
     },
     "filterFn": {
      "!type": "fn()",
      "!doc": "Applies a filter to `SchedulerEvent`s.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_filterFn"
     },
     "height": {
      "!type": "fn()",
      "!doc": "Contains the height of a `SchedulerView` in pixels.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_height"
     },
     "initialScroll": {
      "!type": "fn()",
      "!doc": "Determines the initial scroll behavior for this view. If false,\nthere will be no scrolling when the view is first shown. When set\nto true the view will scroll to the current date and time. If set\nto a date the view will scroll to that date instead.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_initialScroll"
     },
     "isoTime": {
      "!type": "fn()",
      "!doc": "Indicates whether this `SchedulerView` should use international\nstandard time.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_isoTime"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this view.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_name"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the navigation date.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_navigationDateFormatter"
     },
     "nextDate": {
      "!type": "fn()",
      "!doc": "Contains the next `Date` in the `SchedulerView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_nextDate"
     },
     "prevDate": {
      "!type": "fn()",
      "!doc": "Contains the previous `Date` in the `SchedulerView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_prevDate"
     },
     "scheduler": {
      "!type": "fn()",
      "!doc": "Contains this `SchedulerView`'s `SchedulerBase' object.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_scheduler"
     },
     "scrollable": {
      "!type": "fn()",
      "!doc": "Indicates whether this `SchedulerView` is scrollable.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_scrollable"
     },
     "triggerNode": {
      "!type": "fn()",
      "!doc": "Contains the `Node` that triggers.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_triggerNode"
     },
     "visible": {
      "!type": "fn()",
      "!doc": "Indicates whether the calendar is visible.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#attribute_visible"
     },
     "getAdjustedViewDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Returns a date value of the date with its time adjusted\nto midnight.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_getAdjustedViewDate"
     },
     "flushViewCache": {
      "!type": "fn()",
      "!doc": "Removes all data from `evtDateStack`, `evtRenderedStack` and\n`rowDateTableStack`.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_flushViewCache"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_getPrevDate"
     },
     "getToday": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the current date.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_getToday"
     },
     "limitDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date, maxDate: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Returns a clone of a given `date` that will adjust to the `maxDate`\nif it occurs after `maxDate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_limitDate"
     },
     "plotEvents": {
      "!type": "fn()",
      "!doc": "Plots all events in the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_plotEvents"
     },
     "scrollToDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date)",
      "!doc": "Scrolls to given date.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_scrollToDate"
     },
     "syncStdContent": {
      "!type": "fn()",
      "!doc": "Sync `SchedulerView` StdContent.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_syncStdContent"
     },
     "syncEventUI": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent)",
      "!doc": "Sync `event` on the UI.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method_syncEventUI"
     },
     "_afterBasePlotEvents": {
      "!type": "fn()",
      "!doc": "Syncs the UI according to the value of the `initialScroll` attribute.",
      "!url": "http://alloyui.com/classes/A.SchedulerView.html#method__afterBasePlotEvents"
     }
    },
    "BIND_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes\nfor the bindUI lifecycle phase.",
     "!url": "http://alloyui.com/classes/A.SchedulerView.html#property_BIND_UI_ATTRS"
    }
   },
   "A.SchedulerEvents": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerEvents",
    "!proto": "ModelList",
    "!doc": "A base class for `SchedulerEvents`.",
    "!url": "http://alloyui.com/classes/A.SchedulerEvents.html",
    "prototype": {
     "comparator": {
      "!type": "fn(model: Object) -> number",
      "!doc": "Compares the inputs of a start and end date to see if adding `1` to the\nstart date time is larger than the difference between start and end date\ntimes.",
      "!url": "http://alloyui.com/classes/A.SchedulerEvents.html#method_comparator"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerEvents`.",
     "!url": "http://alloyui.com/classes/A.SchedulerEvents.html#property_ATTRS"
    }
   },
   "A.SchedulerEventSupport": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerEventSupport",
    "!doc": "A base class for `SchedulerEventSupport`.",
    "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerEventSupport`.",
     "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#property_ATTRS"
    },
    "prototype": {
     "addEvents": {
      "!type": "fn(models: Array) -> +aui_scheduler.A.SchedulerEvents",
      "!doc": "Adds and returns the collection of events for this `Scheduler`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_addEvents"
     },
     "eachEvent": {
      "!type": "fn(fn: fn()) -> +aui_scheduler.A.SchedulerEvents",
      "!doc": "Applies a `function` to the collection of `Scheduler` events.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_eachEvent"
     },
     "flushEvents": {
      "!type": "fn()",
      "!doc": "Deletes each event in the collection of `Scheduler` events.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_flushEvents"
     },
     "getEventByClientId": {
      "!type": "fn(clientId: string) -> +Object",
      "!doc": "Returns the event by matching it's `clientId`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_getEventByClientId"
     },
     "getEvents": {
      "!type": "fn(filterFn: fn()) -> +Array",
      "!doc": "Gets a collection of events.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_getEvents"
     },
     "getEventsByDay": {
      "!type": "fn(date: aui_datatype_date_parse.Date, includeOverlap: bool) -> +Array",
      "!doc": "Gets a collection of events within a given day. It will filter\noverlapping events by default unless `includeOverlap` is true.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_getEventsByDay"
     },
     "getIntersectEvents": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +Array",
      "!doc": "Returns the list of all events that intersect with a given date. Events\nthat are not visible are not included in this list.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_getIntersectEvents"
     },
     "removeEvents": {
      "!type": "fn(models: Array) -> +aui_scheduler.A.SchedulerEvents",
      "!doc": "Removes given `SchedulerEvents` from the scheduler.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_removeEvents"
     },
     "resetEvents": {
      "!type": "fn(models: Array) -> +aui_scheduler.A.SchedulerEvents",
      "!doc": "Completely replaces all `SchedulerEvents` in the list with the given\n`SchedulerEvents`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventSupport.html#method_resetEvents"
     }
    }
   },
   "A.SchedulerBase": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerBase",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for `SchedulerBase`.",
    "!url": "http://alloyui.com/classes/A.SchedulerBase.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerBase.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerBase`.",
     "!url": "http://alloyui.com/classes/A.SchedulerBase.html#property_ATTRS"
    },
    "prototype": {
     "activeView": {
      "!type": "fn()",
      "!doc": "Contains the active view.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_activeView"
     },
     "ariaLabels": {
      "!type": "fn()",
      "!doc": "Contains the aria labels.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_ariaLabels"
     },
     "date": {
      "!type": "fn()",
      "!doc": "Contains the date corresponding to the current date which is the\nvalue of the date set on the user's computer.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_date"
     },
     "focusmanager": {
      "!type": "fn()",
      "!doc": "Defines the keyboard configuration object for\n`Plugin.NodeFocusManager`.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_focusmanager"
     },
     "eventRecorder": {
      "!type": "fn()",
      "!doc": "Contains the `Scheduler`'s `SchedulerEventRecorder` instance.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_eventRecorder"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Contains the collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_strings"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the navigation date.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_navigationDateFormatter"
     },
     "views": {
      "!type": "fn()",
      "!doc": "Contains the list of views belonging to this `Scheduler`.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_views"
     },
     "viewDate": {
      "!type": "fn()",
      "!doc": "Contains the `Scheduler`'s current date. If there is an `activeView`,\nthis attribute will contain the `activeView`'s current date.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_viewDate"
     },
     "firstDayOfWeek": {
      "!type": "fn()",
      "!doc": "First day of the week: Sunday is 0, Monday is 1.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_firstDayOfWeek"
     },
     "todayDate": {
      "!type": "fn()",
      "!doc": "Today date representation. This option allows the developer to\nspecify the date he wants to be used as the today date.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#attribute_todayDate"
     },
     "getViewByName": {
      "!type": "fn(name: string) -> +aui_scheduler.A.SchedulerView",
      "!doc": "Returns the `SchedulerView` that belongs to a given name.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_getViewByName"
     },
     "getStrings": {
      "!type": "fn() -> string",
      "!doc": "Returns this `Scheduler`'s `strings` attribute value.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_getStrings"
     },
     "getString": {
      "!type": "fn(key: string) -> string",
      "!doc": "Returns the string that matches the `key` type.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_getString"
     },
     "getAriaLabel": {
      "!type": "fn(key: string) -> string",
      "!doc": "Returns the aria label that matches the `key` type.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_getAriaLabel"
     },
     "renderView": {
      "!type": "fn(view: aui_scheduler.A.SchedulerView)",
      "!doc": "Renders the `SchedulerView` based on the given `view` parameter\nunder `instance.bodyNode`.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_renderView"
     },
     "plotViewEvents": {
      "!type": "fn(view)",
      "!doc": "Plots all events for the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_plotViewEvents"
     },
     "syncEventsUI": {
      "!type": "fn()",
      "!doc": "Plots the `activeView` events value.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_syncEventsUI"
     },
     "renderButtonGroup": {
      "!type": "fn()",
      "!doc": "Renders a new `ButtonGroup` and attaches it to the `Scheduler`\ninstances as a property `instance.buttonGroup`. It is rendered under\nthe `Scheduler` instance's `viewsNode`.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_renderButtonGroup"
     },
     "syncStdContent": {
      "!type": "fn()",
      "!doc": "Sync `SchedulerBase` StdContent.",
      "!url": "http://alloyui.com/classes/A.SchedulerBase.html#method_syncStdContent"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Contains an object hash, defining how attribute values are to be parsed\nfrom markup contained in the widget's bounding box.",
     "!url": "http://alloyui.com/classes/A.SchedulerBase.html#property_HTML_PARSER"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.SchedulerBase.html#property_UI_ATTRS"
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.SchedulerBase.html#property_AUGMENTS"
    }
   },
   "A.SchedulerEventRecorder": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerEventRecorder",
    "!proto": "aui_scheduler.A.SchedulerEvent",
    "!doc": "A base class for `SchedulerEventRecorder`.",
    "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerEventRecorder`.",
     "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#property_ATTRS"
    },
    "prototype": {
     "allDay": {
      "!type": "fn()",
      "!doc": "Determines whether a new event will take place all day. When enabled,\nthe event will not contain 24-hour clock date inputs.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_allDay"
     },
     "content": {
      "!type": "fn()",
      "!doc": "Determines the content of this Scheduler event recorder's body\nsection.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_content"
     },
     "duration": {
      "!type": "fn()",
      "!doc": "Contains the duration of an `event` in minutes.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_duration"
     },
     "dateFormat": {
      "!type": "fn()",
      "!doc": "Contains the default date format for an `event`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_dateFormat"
     },
     "event": {
      "!type": "fn()",
      "!doc": "A scheduler `event` is the wrapper object that contains an `event`\ntitle, start and end times and a description.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_event"
     },
     "popover": {
      "!type": "fn()",
      "!doc": "Contains the scheduler event recorder's `popover` instance.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_popover"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Collection of strings used to label elements of the UI.\nThis attribute defaults to `{}` unless the attribute is set.\nWhen this attribute is set, the passed value merges with a\npseudo-default collection of strings.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_strings"
     },
     "bodyTemplate": {
      "!type": "fn()",
      "!doc": "Contains the `SchedulerEventRecorder`'s body template.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_bodyTemplate"
     },
     "headerTemplate": {
      "!type": "fn()",
      "!doc": "Contains the `SchedulerEventRecorder`'s header template.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#attribute_headerTemplate"
     },
     "getContentNode": {
      "!type": "fn() -> +aui_node.Node",
      "!doc": "Gets the content node belonging to the `popover`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_getContentNode"
     },
     "getFormattedDate": {
      "!type": "fn() -> string",
      "!doc": "Returns the formatted date including start and end hours if the event\nis not `allDay`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_getFormattedDate"
     },
     "getTemplateData": {
      "!type": "fn() -> +Object",
      "!doc": "Returns this Scheduler event recorder's `content`, and dates.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_getTemplateData"
     },
     "getUpdatedSchedulerEvent": {
      "!type": "fn(optAttrMap: Object) -> +Object",
      "!doc": "Returns an updated event and also merges in any additional attributes\npassed in as `optAttrMap`.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_getUpdatedSchedulerEvent"
     },
     "hidePopover": {
      "!type": "fn()",
      "!doc": "Hides this Scheduler event recorder's `popover` component.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_hidePopover"
     },
     "populateForm": {
      "!type": "fn()",
      "!doc": "Loads template data into the Scheduler event recorder's form.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_populateForm"
     },
     "serializeForm": {
      "!type": "fn() -> string",
      "!doc": "Converts this event recorder's form node object to a string.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_serializeForm"
     },
     "showPopover": {
      "!type": "fn()",
      "!doc": "Hides this Scheduler event recorder's `popover` component.",
      "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#method_showPopover"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerEventRecorder.html#property_EXTENDS"
    }
   },
   "A.SchedulerAgendaView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerAgendaView",
    "!proto": "aui_scheduler.A.SchedulerView",
    "!doc": "A base class for `SchedulerAgendaView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerAgendaView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determines the content of Scheduler view agenda's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_bodyContent"
     },
     "eventsDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the events date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_eventsDateFormatter"
     },
     "headerDayDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the header day date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_headerDayDateFormatter"
     },
     "headerExtraDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the header extra date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_headerExtraDateFormatter"
     },
     "infoDayDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the info day date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_infoDayDateFormatter"
     },
     "infoLabelBigDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the info label date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_infoLabelBigDateFormatter"
     },
     "infoLabelSmallDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the info label small date.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_infoLabelSmallDateFormatter"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this agenda.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_name"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Contains the collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_strings"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the agenda view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the agenda view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#method_getPrevDate"
     },
     "plotEvents": {
      "!type": "fn()",
      "!doc": "Plots all events in the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#method_plotEvents"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#property_EXTENDS"
    }
   },
   "A.SchedulerDayView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerDayView",
    "!proto": "aui_scheduler.A.SchedulerView",
    "!doc": "A base class for `SchedulerDayView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerDayView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerDayView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determines the content of Scheduler day view's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_bodyContent"
     },
     "currentTimeNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `currentTime` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_currentTimeNode!~YUIDOC_LINE~!return"
     },
     "days": {
      "!type": "fn()",
      "!doc": "Contains the number of day columns this view displays.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_days"
     },
     "delegateConfig": {
      "!type": "fn()",
      "!doc": "Configures this view's `DD.Delegate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_delegateConfig"
     },
     "eventWidth": {
      "!type": "fn()",
      "!doc": "Contains the width of a `SchedulerView` in pixels.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_eventWidth"
     },
     "filterFn": {
      "!type": "fn()",
      "!doc": "Applies a filter to `SchedulerEvent`s.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_filterFn"
     },
     "headerDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the header date.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_headerDateFormatter"
     },
     "headerView": {
      "!type": "fn()",
      "!doc": "Contains the header view.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_headerView"
     },
     "headerViewConfig": {
      "!type": "fn()",
      "!doc": "Configures the header day view.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_headerViewConfig"
     },
     "hourHeight": {
      "!type": "fn()",
      "!doc": "Contains the height of an hour in pixels.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_hourHeight"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this day view.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_name"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the navigation date.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_navigationDateFormatter"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Contains the collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_strings"
     },
     "headerTableNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `headerTable` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_headerTableNode!~YUIDOC_LINE~!return"
     },
     "headerViewLabelNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `headerViewLabel` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_headerViewLabelNode!~YUIDOC_LINE~!return"
     },
     "resizerNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `resizer` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_resizerNode!~YUIDOC_LINE~!return"
     },
     "tableNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `table` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_tableNode!~YUIDOC_LINE~!return"
     },
     "colDaysNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `colDays` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_colDaysNode!~YUIDOC_LINE~!return"
     },
     "colHeaderDaysNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `colHeaderDays` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_colHeaderDaysNode!~YUIDOC_LINE~!return"
     },
     "markercellsNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `markercells` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_markercellsNode!~YUIDOC_LINE~!return"
     },
     "timesNode!~YUIDOC_LINE~!return": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `times` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#attribute_timesNode!~YUIDOC_LINE~!return"
     },
     "syncStdContent": {
      "!type": "fn()",
      "!doc": "Sync SchedulerView StdContent.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncStdContent"
     },
     "calculateEventHeight": {
      "!type": "fn(duration: number) -> number",
      "!doc": "Calculates and returns the height of an event based on a given\n`duration`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_calculateEventHeight"
     },
     "calculateTop": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> number",
      "!doc": "Calculates and returns the value needed to get the `top` property\ngive a `date`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_calculateTop"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the day view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the day view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getPrevDate"
     },
     "getColumnByDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> number",
      "!doc": "Returns the column `Node` determined by a given `Date`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getColumnByDate"
     },
     "getColumnShimByDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> number",
      "!doc": "Returns the column shim `Node` determined by a given `Date`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getColumnShimByDate"
     },
     "getDateByColumn": {
      "!type": "fn(colNumber) -> ?",
      "!doc": "Returns the `Date` determined by a given column `Node`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getDateByColumn"
     },
     "getDateDaysOffset": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> number",
      "!doc": "Returns the number of offset days.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getDateDaysOffset"
     },
     "getYCoordTime": {
      "!type": "fn(top: number) -> +Array",
      "!doc": "Returns the time at the Y coordinate from a given top position.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getYCoordTime"
     },
     "plotEvent": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent)",
      "!doc": "Plots a given event for the day view.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_plotEvent"
     },
     "plotEvents": {
      "!type": "fn()",
      "!doc": "Plots all events in the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_plotEvents"
     },
     "scrollToDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date)",
      "!doc": "Scrolls to given date.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_scrollToDate"
     },
     "syncColumnsUI": {
      "!type": "fn()",
      "!doc": "Syncs the `SchedulerView` `columns` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncColumnsUI"
     },
     "syncCurrentTimeUI": {
      "!type": "fn()",
      "!doc": "Syncs the `SchedulerView` current time marker. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncCurrentTimeUI"
     },
     "syncDaysHeaderUI": {
      "!type": "fn()",
      "!doc": "Syncs the `SchedulerView` `daysHeader` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncDaysHeaderUI"
     },
     "syncEventsIntersectionUI": {
      "!type": "fn(columnEvents: Array)",
      "!doc": "Syncs the `SchedulerView` `eventsIntersection` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncEventsIntersectionUI"
     },
     "syncEventHeightUI": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent)",
      "!doc": "Syncs the `SchedulerView` `eventHeight` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncEventHeightUI"
     },
     "syncEventTopUI": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent)",
      "!doc": "Syncs the `SchedulerView` `eventTop` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncEventTopUI"
     },
     "syncHeaderViewUI": {
      "!type": "fn()",
      "!doc": "Syncs the `SchedulerView` `headerView` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_syncHeaderViewUI"
     },
     "calculateYDelta": {
      "!type": "fn(startXY: Array, xy: Array)",
      "!doc": "Calculates the Y delta between two XY coordinates.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_calculateYDelta"
     },
     "findEventIntersections": {
      "!type": "fn(evt: aui_scheduler.A.SchedulerEvent, Array: Array) -> +Array",
      "!doc": "Returns a collection of `SchedulerEvents` as the parameter `events`\nthat intersect with `evt`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_findEventIntersections"
     },
     "getXYDelta": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Calculates the XY delta between the `event.currentTarget` XY\ncoordinates as well as the XY coordinates from the event page.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getXYDelta"
     },
     "getTickY": {
      "!type": "fn() -> number",
      "!doc": "Returns the nearest multiple of 10 to half the height of this\n`SchedulerView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_getTickY"
     },
     "roundToNearestHour": {
      "!type": "fn(date: aui_datatype_date_parse.Date, time: Array)",
      "!doc": "Rounds a given `Date` to a given hour represented as time.",
      "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#method_roundToNearestHour"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Contains an object hash, defining how attribute values are to be parsed\nfrom markup contained in the widget's bounding box.",
     "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#property_HTML_PARSER"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerDayView.html#property_EXTENDS"
    }
   },
   "A.SchedulerMonthView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerMonthView",
    "!proto": "aui_scheduler.A.SchedulerTableView",
    "!doc": "A base class for `SchedulerMonthView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerMonthView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#property_ATTRS"
    },
    "prototype": {
     "displayDaysInterval": {
      "!type": "fn()",
      "!doc": "Contains the number of Days to display in a month view.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#attribute_displayDaysInterval"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this month view.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#attribute_name"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the navigation date.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#attribute_navigationDateFormatter"
     },
     "getAdjustedViewDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Returns a date value of the first day of the month with its time\nadjusted to midnight.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#method_getAdjustedViewDate"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the month view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the month view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#method_getPrevDate"
     },
     "plotEvents": {
      "!type": "fn()",
      "!doc": "Plots all events in the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#method_plotEvents"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerMonthView.html#property_EXTENDS"
    }
   },
   "A.SchedulerTableViewDD": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerTableViewDD",
    "!doc": "A base class for `SchedulerTableViewDD`.",
    "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerTableViewDD`.",
     "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#property_ATTRS"
    },
    "prototype": {
     "delegateConfig": {
      "!type": "fn()",
      "!doc": "Configures this view's `DD.Delegate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#attribute_delegateConfig"
     },
     "viewDDBindUI": {
      "!type": "fn()",
      "!doc": "Binds the scheduler view `DD.Delegate` events on the UI. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_viewDDBindUI"
     },
     "viewDDRenderUI": {
      "!type": "fn()",
      "!doc": "Renders the scheduler view `DD.Delegate` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_viewDDRenderUI"
     },
     "viewDDSyncUI": {
      "!type": "fn()",
      "!doc": "Syncs the scheduler view `DD.Delegate` instance. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_viewDDSyncUI"
     },
     "removeLasso": {
      "!type": "fn()",
      "!doc": "Removes the table view lasso.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_removeLasso"
     },
     "removeProxy": {
      "!type": "fn()",
      "!doc": "Removes the table view proxy node.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_removeProxy"
     },
     "renderLasso": {
      "!type": "fn(startPos: Array, endPos: Array)",
      "!doc": "Renders the table view lasso at the given `ij` coordinates for the table\nmatrix. It represents the selection for the table view, e.g. `j`\nrepresents a row and `i` a column, for `startPos` being `[0,0]` and\n`endPos` being `[0,3]`, this method will render three nodes representing\nthe selected lasso.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableViewDD.html#method_renderLasso"
     }
    }
   },
   "A.SchedulerTableView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerTableView",
    "!proto": "aui_scheduler.A.SchedulerView",
    "!doc": "A base class for `SchedulerTableView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerTableView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerTableView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determines the content of Scheduler table view's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_bodyContent"
     },
     "displayDaysInterval": {
      "!type": "fn()",
      "!doc": "Contains the number of days to display per interval in the\n`SchedulerTableView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_displayDaysInterval"
     },
     "displayRows": {
      "!type": "fn()",
      "!doc": "Contains the number of rows to display in the `SchedulerTableView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_displayRows"
     },
     "fixedHeight": {
      "!type": "fn()",
      "!doc": "Indicates whether the height of the `SchedulerTableView` is fixed.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_fixedHeight"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this `SchedulerTableView`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_name"
     },
     "headerDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the header date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_headerDateFormatter"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the function that formats the navigation date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_navigationDateFormatter"
     },
     "scrollable": {
      "!type": "fn()",
      "!doc": "Indicates whether the `SchedulerTableView` is scrollable.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_scrollable"
     },
     "strings": {
      "!type": "fn()",
      "!doc": "Contains the collection of strings used to label elements of the UI.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_strings"
     },
     "headerTableNode": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `headerTable` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_headerTableNode"
     },
     "colHeaderDaysNode": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `colHeaderDays` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_colHeaderDaysNode"
     },
     "rowsContainerNode": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `rowsContainer` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_rowsContainerNode"
     },
     "tableGridNode": {
      "!type": "fn()",
      "!doc": "Contains the function that returns the `tableGrid` node.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#attribute_tableGridNode"
     },
     "buildEventsRow": {
      "!type": "fn(rowStartDate: aui_datatype_date_parse.Date, rowEndDate: aui_datatype_date_parse.Date, rowDisplayIndex: number) -> +aui_node.Node",
      "!doc": "Builds a row of events.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_buildEventsRow"
     },
     "buildEventsTable": {
      "!type": "fn(rowStartDate: aui_datatype_date_parse.Date, rowEndDate: aui_datatype_date_parse.Date) -> +aui_node.Node",
      "!doc": "Builds a table of events.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_buildEventsTable"
     },
     "buildEventsTitleRow": {
      "!type": "fn(tableNode: aui_node.Node, rowStartDate: aui_datatype_date_parse.Date, rowEndDate: aui_datatype_date_parse.Date) -> +aui_node.Node",
      "!doc": "Builds a row with the title and today's date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_buildEventsTitleRow"
     },
     "buildGridRowNode": {
      "!type": "fn(rowIndex: number) -> +aui_node.Node",
      "!doc": "Builds a new row `Node` and appends a table grid `Node`. Returns the\nrow `Node`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_buildGridRowNode"
     },
     "flushViewCache": {
      "!type": "fn()",
      "!doc": "Removes all data from `evtDateStack`, `evtRenderedStack` and\n`rowDateTableStack`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_flushViewCache"
     },
     "getIntersectEvents": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +Array",
      "!doc": "Returns the list of all events that intersect with a given date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_getIntersectEvents"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the `SchedulerTableView`'s\n        current date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the\n`SchedulerTableView`'s current date.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_getPrevDate"
     },
     "hideEventsOverlay": {
      "!type": "fn()",
      "!doc": "Hides this `SchedulerViewTable` event's `overlay` component.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_hideEventsOverlay"
     },
     "loopDates": {
      "!type": "fn(startDate: aui_datatype_date_parse.Date, endDate: aui_datatype_date_parse.Date, fn: fn(), incrementBy: string, factor: number)",
      "!doc": "Applies a given function to each date between `startDate` and\n`endDate`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_loopDates"
     },
     "plotEvents": {
      "!type": "fn()",
      "!doc": "Plots all events in the current view.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_plotEvents"
     },
     "syncDaysHeaderUI": {
      "!type": "fn()",
      "!doc": "Updates the `SchedulerTableView`'s `colHeaderDaysNode` to reflect\nany changes made to the instance attributes.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_syncDaysHeaderUI"
     },
     "syncGridUI": {
      "!type": "fn()",
      "!doc": "Updates the `SchedulerTableView`'s column grid by moving styling to\nthe current day cell `Node`.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_syncGridUI"
     },
     "syncStdContent": {
      "!type": "fn()",
      "!doc": "Sync SchedulerView content.",
      "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#method_syncStdContent"
     }
    },
    "HTML_PARSER": {
     "!type": "+Object",
     "!doc": "Contains an object hash, defining how attribute values are to be parsed\nfrom markup contained in the widget's bounding box.",
     "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#property_HTML_PARSER"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerTableView.html#property_EXTENDS"
    }
   },
   "A.SchedulerWeekView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerWeekView",
    "!proto": "aui_scheduler.A.SchedulerDayView",
    "!doc": "A base class for `SchedulerWeekView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `SchedulerWeekView`.",
     "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#property_ATTRS"
    },
    "prototype": {
     "bodyContent": {
      "!type": "fn()",
      "!doc": "Determines the content of Scheduler week view's body section.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#attribute_bodyContent"
     },
     "days": {
      "!type": "fn()",
      "!doc": "Contains the number of days in a week.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#attribute_days"
     },
     "headerViewConfig": {
      "!type": "fn()",
      "!doc": "Configures the header week view.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#attribute_headerViewConfig"
     },
     "name": {
      "!type": "fn()",
      "!doc": "Determines the name for this week view.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#attribute_name"
     },
     "navigationDateFormatter": {
      "!type": "fn()",
      "!doc": "Contains the formatted navigation date formatter for this week view.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#attribute_navigationDateFormatter"
     },
     "getAdjustedViewDate": {
      "!type": "fn(date: aui_datatype_date_parse.Date) -> +aui_datatype_date_parse.Date",
      "!doc": "Returns a date value of the first day of the week with its time\nadjusted to midnight.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#method_getAdjustedViewDate"
     },
     "getNextDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that follows the week view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#method_getNextDate"
     },
     "getPrevDate": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the date that preceeds the week view's current\ndate.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#method_getPrevDate"
     },
     "getToday": {
      "!type": "fn() -> +aui_datatype_date_parse.Date",
      "!doc": "Returns the value of the week view's current date.",
      "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#method_getToday"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SchedulerWeekView.html#property_EXTENDS"
    }
   }
  },
  "aui_scheduler_touch": {
   "A.SchedulerAgendaView": {
    "!type": "fn(config: Object) -> +aui_scheduler.A.SchedulerAgendaView",
    "!proto": "aui_scheduler.A.SchedulerView",
    "!doc": "A base class for `SchedulerAgendaView`.",
    "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html",
    "prototype": {
     "eventWidth": {
      "!type": "fn()",
      "!doc": "Contains the width of a `SchedulerView` in pixels.",
      "!url": "http://alloyui.com/classes/A.SchedulerAgendaView.html#attribute_eventWidth"
     }
    }
   }
  },
  "aui_scrollspy": {
   "A.Scrollspy": {
    "!type": "fn(config: Object) -> +aui_scrollspy.A.Scrollspy",
    "!proto": "Base",
    "!doc": "A base class for Scrollspy.\n\nCheck the [live demo](http://alloyui.com/examples/scrollspy/).",
    "!url": "http://alloyui.com/classes/A.Scrollspy.html",
    "prototype": {
     "activate": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Fired when any target's link changes.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#event_activate"
     },
     "clearCachedLinks": {
      "!type": "fn()",
      "!doc": "Cleans the cached links.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#method_clearCachedLinks"
     },
     "refresh": {
      "!type": "fn()",
      "!doc": "Recalculates the current active node in the list and resets the active\nCSS class names.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#method_refresh"
     },
     "activeGroup": {
      "!type": "fn()",
      "!doc": "Ancestors which should be added the .active class.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#attribute_activeGroup"
     },
     "activeClass": {
      "!type": "fn()",
      "!doc": "Class to be used as active class.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#attribute_activeClass"
     },
     "offset": {
      "!type": "fn()",
      "!doc": "Pixels to offset from top when calculating position of scroll.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#attribute_offset"
     },
     "scrollNode": {
      "!type": "fn()",
      "!doc": "Container that maps target links.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#attribute_scrollNode"
     },
     "target": {
      "!type": "fn()",
      "!doc": "Target list. Usually a nav bar element with anchors.",
      "!url": "http://alloyui.com/classes/A.Scrollspy.html#attribute_target"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Scrollspy.",
     "!url": "http://alloyui.com/classes/A.Scrollspy.html#property_ATTRS"
    }
   }
  },
  "aui_search": {
   "A.TernarySearchNode": {
    "!type": "fn(config: Object) -> +aui_search.A.TernarySearchNode",
    "!proto": "Base",
    "!doc": "A base class for TernarySearchNode.",
    "!url": "http://alloyui.com/classes/A.TernarySearchNode.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#property_NS"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.TernarySearchNode`.",
     "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#property_ATTRS"
    },
    "prototype": {
     "character": {
      "!type": "fn()",
      "!doc": "String formed by a single letter.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#attribute_character"
     },
     "child": {
      "!type": "fn()",
      "!doc": "The child node in the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#attribute_child"
     },
     "largerNode": {
      "!type": "fn()",
      "!doc": "The larger node in the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#attribute_largerNode"
     },
     "smallerNode": {
      "!type": "fn()",
      "!doc": "The smaller node in the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#attribute_smallerNode"
     },
     "word": {
      "!type": "fn()",
      "!doc": "String formed by a group of letters.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#attribute_word"
     },
     "isEndOfWord": {
      "!type": "fn()",
      "!doc": "Converts the `word` attribute value to a `Boolean` and ensures a\n`Boolean` type.",
      "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#method_isEndOfWord"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TernarySearchNode.html#property_EXTENDS"
    }
   },
   "A.TernarySearchTree": {
    "!type": "fn(config: Object) -> +aui_search.A.TernarySearchTree",
    "!proto": "Base",
    "!doc": "A base class for TernarySearchTree.",
    "!url": "http://alloyui.com/classes/A.TernarySearchTree.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#property_NAME"
    },
    "NS": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the namespace.",
     "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#property_NS"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#property_EXTENDS"
    },
    "prototype": {
     "add": {
      "!type": "fn(word)",
      "!doc": "Adds a word in the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#method_add"
     },
     "contains": {
      "!type": "fn(word) -> bool",
      "!doc": "Checks if the argument is part of the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#method_contains"
     },
     "empty": {
      "!type": "fn()",
      "!doc": "Set tree's root to `null`.",
      "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#method_empty"
     },
     "patternMatch": {
      "!type": "fn(pattern) -> +Array",
      "!doc": "Checks if a pattern match.",
      "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#method_patternMatch"
     },
     "prefixSearch": {
      "!type": "fn(prefix) -> +Array",
      "!doc": "Searches for a prefix in the tree.",
      "!url": "http://alloyui.com/classes/A.TernarySearchTree.html#method_prefixSearch"
     }
    }
   }
  },
  "aui_selector": {
   "A.Selector": {
    "!type": "fn() -> +aui_selector.A.Selector",
    "!doc": "Augment the [YUI3 Selector](Selector.html) with more util methods.",
    "!url": "http://alloyui.com/classes/A.Selector.html",
    "prototype": {
     "button": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is a button element or contains `type=\"button\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_button"
     },
     "checkbox": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"checkbox\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_checkbox"
     },
     "checked": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is checked or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_checked"
     },
     "disabled": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is disabled or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_disabled"
     },
     "empty": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is empty or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_empty"
     },
     "enabled": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is enabled or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_enabled"
     },
     "file": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"file\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_file"
     },
     "header": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is a header (e.g. `<h1>`, `<h2>`, ...) or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_header"
     },
     "hidden": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is hidden or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_hidden"
     },
     "image": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"image\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_image"
     },
     "input": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is an input (e.g. `<textarea>`, `<input>`, ...) or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_input"
     },
     "parent": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node contains a child or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_parent"
     },
     "password": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"password\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_password"
     },
     "radio": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"radio\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_radio"
     },
     "reset": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"reset\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_reset"
     },
     "selected": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is selected or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_selected"
     },
     "submit": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"submit\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_submit"
     },
     "text": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the node contains `type=\"text\"`.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_text"
     },
     "visible": {
      "!type": "fn(node) -> bool",
      "!doc": "Checks if the node is visible or not.",
      "!url": "http://alloyui.com/classes/A.Selector.html#method_visible"
     }
    }
   }
  },
  "aui_sortable_layout": {
   "A.SortableLayout": {
    "!type": "fn(config: Object) -> +aui_sortable_layout.A.SortableLayout",
    "!proto": "Base",
    "!doc": "A base class for SortableLayout, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- DragDrop utility for drag lists, portal layouts (portlets)\n\nCheck the [live demo](http://alloyui.com/examples/sortable-layout/).",
    "!url": "http://alloyui.com/classes/A.SortableLayout.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SortableLayout.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.SortableLayout`.",
     "!url": "http://alloyui.com/classes/A.SortableLayout.html#property_ATTRS"
    },
    "prototype": {
     "delegateConfig": {
      "!type": "fn()",
      "!doc": "Configuration object for delegate.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_delegateConfig"
     },
     "proxyNode": {
      "!type": "fn()",
      "!doc": "Proxy drag node used instead of dragging the original node.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_proxyNode"
     },
     "dragNodes": {
      "!type": "fn()",
      "!doc": "The CSS class name used to define which nodes are draggable.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_dragNodes"
     },
     "dropContainer": {
      "!type": "fn()",
      "!doc": "The container which serves to host dropped elements.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_dropContainer"
     },
     "dropNodes": {
      "!type": "fn()",
      "!doc": "The CSS class name used to define which nodes serve as container to\nbe dropped.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_dropNodes"
     },
     "groups": {
      "!type": "fn()",
      "!doc": "List of elements to add this sortable layout into.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_groups"
     },
     "lazyStart": {
      "!type": "fn()",
      "!doc": "Specifies if the start should be delayed.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_lazyStart"
     },
     "placeholder": {
      "!type": "fn()",
      "!doc": "Simulates the position of the dragged element.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_placeholder"
     },
     "proxy": {
      "!type": "fn()",
      "!doc": "Proxy element to be used when dragging.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#attribute_proxy"
     },
     "addDropNode": {
      "!type": "fn(node, config)",
      "!doc": "Checks if the `Node` isn't a drop node. If not, creates a new Drop\ninstance and adds to drop target group.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_addDropNode"
     },
     "addDropTarget": {
      "!type": "fn(drop)",
      "!doc": "Adds a Drop instance to a group.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_addDropTarget"
     },
     "alignPlaceholder": {
      "!type": "fn(region, isTarget)",
      "!doc": "Sync placeholder size and set its X and Y positions.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_alignPlaceholder"
     },
     "calculateDirections": {
      "!type": "fn(drag)",
      "!doc": "Calculates drag's X and Y directions.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_calculateDirections"
     },
     "calculateQuadrant": {
      "!type": "fn(drag, drop) -> number",
      "!doc": "Calculates quadrant position.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_calculateQuadrant"
     },
     "getPlaceholderXY": {
      "!type": "fn(region, isTarget) -> +Array",
      "!doc": "Gets placeholder X and Y positions.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_getPlaceholderXY"
     },
     "removeDropTarget": {
      "!type": "fn(drop)",
      "!doc": "Removes a Drop instance from group.",
      "!url": "http://alloyui.com/classes/A.SortableLayout.html#method_removeDropTarget"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SortableLayout.html#property_EXTENDS"
    }
   }
  },
  "aui_sortable_list": {
   "A.SortableList": {
    "!type": "fn(config: Object) -> +aui_sortable_list.A.SortableList",
    "!proto": "Base",
    "!doc": "A base class for SortableList, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Sortable list utility\n\nCheck the [live demo](http://alloyui.com/examples/sortable-list/).",
    "!url": "http://alloyui.com/classes/A.SortableList.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.SortableList.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.SortableList`.",
     "!url": "http://alloyui.com/classes/A.SortableList.html#property_ATTRS"
    },
    "prototype": {
     "dd": {
      "!type": "fn()",
      "!doc": "Drag & Drop plugin attached to the widget.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_dd"
     },
     "dropCondition": {
      "!type": "fn()",
      "!doc": "Validates the condition for an element to be dropped.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_dropCondition"
     },
     "dropContainer": {
      "!type": "fn()",
      "!doc": "The container which serves to host dropped elements.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_dropContainer"
     },
     "dropOn": {
      "!type": "fn()",
      "!doc": "The CSS class name used to define which nodes serve as container to\nbe dropped.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_dropOn"
     },
     "helper": {
      "!type": "fn()",
      "!doc": "Indicates that the element is being dragged.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_helper"
     },
     "nodes": {
      "!type": "fn()",
      "!doc": "The CSS class name used to define which nodes are draggable.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_nodes"
     },
     "placeholder": {
      "!type": "fn()",
      "!doc": "Simulates the position of the dragged element.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_placeholder"
     },
     "proxy": {
      "!type": "fn()",
      "!doc": "Proxy element to be used when dragging.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_proxy"
     },
     "sortCondition": {
      "!type": "fn()",
      "!doc": "Validates the condition for an element to be sorted.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#attribute_sortCondition"
     },
     "add": {
      "!type": "fn(node)",
      "!doc": "Creates a drag instance from a single node.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#method_add"
     },
     "addAll": {
      "!type": "fn(nodes)",
      "!doc": "Creates drag instances from a list of nodes.",
      "!url": "http://alloyui.com/classes/A.SortableList.html#method_addAll"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.SortableList.html#property_EXTENDS"
    }
   },
   "A.Tab": {
    "!type": "fn(config: Object) -> +aui_tabview.A.Tab",
    "!proto": "Tab",
    "!doc": "A base class for Tab.\n\nCheck the [live demo](http://alloyui.com/examples/tabview/).",
    "!url": "http://alloyui.com/classes/A.Tab.html",
    "prototype": {
     "addScreenRoutes": {
      "!type": "fn(or: Object) -> !this",
      "!doc": "Adds one or more screens to the application.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_addScreenRoutes"
     },
     "addSurfaces": {
      "!type": "fn(or: Surface) -> !this",
      "!doc": "Adds one or more surfaces to the application.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_addSurfaces"
     },
     "dispatch": {
      "!type": "fn() -> +Promise",
      "!doc": "Dispatches to the first route handler that matches the current path, if\nany.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_dispatch"
     },
     "matchesPath": {
      "!type": "fn(value: string) -> bool",
      "!doc": "Matches if the `ScreenRouter` can handle the tested `value` path, if not\nreturns null.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_matchesPath"
     },
     "navigate": {
      "!type": "fn(path: string, opt_replaceHistory: bool) -> +Promise",
      "!doc": "Navigates to the specified path if there is a route handler that matches.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_navigate"
     },
     "_defStartNavigateFn": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Starts navigation to a path.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__defStartNavigateFn"
     },
     "_doNavigate": {
      "!type": "fn(path: string, opt_replaceHistory: bool) -> +Promise",
      "!doc": "Starts navigation to a path.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__doNavigate"
     },
     "_preventNavigateFn": {
      "!type": "fn(event: EventFacade)",
      "!doc": "Fires when navigation is prevented from `startNavigate` event.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__preventNavigateFn"
     },
     "defaultTitle": {
      "!type": "fn()",
      "!doc": "Defines the default document title in case the screen doesn't have\nany `title`.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_defaultTitle"
     },
     "linkSelector": {
      "!type": "fn()",
      "!doc": "CSS selector string used to filter link click events so that only the\nlinks which match it will have the enhanced navigation behavior.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_linkSelector"
     },
     "basePath": {
      "!type": "fn()",
      "!doc": "Absolute base path from which all routes should be evaluated.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_basePath"
     },
     "addContent": {
      "!type": "fn(screenId: string, opt_content: string) -> +aui_node.Node",
      "!doc": "Adds screen content to a surface. If content hasn't been passed, see if\nan element exists in the DOM that matches the id. By convention, the\nelement should already be nested in the right element and should have an\nid that is a concatentation of the surface id + '-' + the screen id.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_addContent"
     },
     "createChild": {
      "!type": "fn(screenId: string) -> +aui_node.Node",
      "!doc": "Creates child node of the surface.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_createChild"
     },
     "getChild": {
      "!type": "fn(screenId: string) -> +aui_node.Node",
      "!doc": "Gets child node of the surface.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_getChild"
     },
     "getEl": {
      "!type": "fn(opt_id: string) -> +aui_node.Node",
      "!doc": "Retrieves the surface element from DOM, and sets it to the el property of\nthe current instance.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_getEl"
     },
     "show": {
      "!type": "fn(screenId: string) -> +Promise",
      "!doc": "Shows screen content from a surface.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_show"
     },
     "remove": {
      "!type": "fn(screenId: string)",
      "!doc": "Removes screen content from a surface.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_remove"
     },
     "toString": {
      "!type": "fn() -> string",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_toString"
     },
     "transition": {
      "!type": "fn()",
      "!doc": "If false, the screen will be disposed after being deactivated.\nIf true, the surface content will be left in the DOM with\ndisplay:none.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_transition"
     },
     "_makeId": {
      "!type": "fn(screenId: string) -> string",
      "!doc": "Make the id for the element that holds content for a screen.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__makeId"
     },
     "id": {
      "!type": "fn()",
      "!doc": "The screen id.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_id"
     },
     "abortRequest": {
      "!type": "fn()",
      "!doc": "Aborts any outstanding request.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_abortRequest"
     },
     "getSurfaceContent": {
      "!type": "fn(surfaceId: string, opt_contents: string) -> string",
      "!doc": "Returns the content for the given surface, or null if the surface isn't\nused by this screen. This will be called when a screen is initially\nconstructed or, if a screen is non-cacheable, when navigated.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_getSurfaceContent"
     },
     "load": {
      "!type": "fn() -> +CancellablePromise",
      "!doc": "Loads the content for all surfaces in one AJAX request from the server.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_load"
     },
     "_setScreenTitleFromFragment": {
      "!type": "fn(frag: aui_node.Node)",
      "!doc": "Retrieves the title from the provided content and sets it to title\nattribute of the class.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__setScreenTitleFromFragment"
     },
     "cacheable": {
      "!type": "fn()",
      "!doc": "If false, the screen will be disposed after being deactivated.\nIf true, the surface content will be left in the DOM with\ndisplay:none.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_cacheable"
     },
     "method": {
      "!type": "fn()",
      "!doc": "Ajax request method.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_method"
     },
     "titleSelector": {
      "!type": "fn()",
      "!doc": "CSS selector used to extract a page title from the content of a page\nloaded via Pjax.\n\nBy default this is set to extract the title from the `<title>`\nelement, but you could customize it to extract the title from an\n`<h1>`, or from any other element, if that's more appropriate for the\ncontent you're loading.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_titleSelector"
     },
     "timeout": {
      "!type": "fn()",
      "!doc": "Time in milliseconds after which an Ajax request should time out.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_timeout"
     },
     "urlParams": {
      "!type": "fn()",
      "!doc": "Could be String or Object with multiple keys and values. If String,\nthe defaule value will be \"1\". If an Object with multiple keys and\nvalues, they will be concatenated to the URL.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_urlParams"
     },
     "path": {
      "!type": "fn()",
      "!doc": "Defines the path which will trigger the rendering of the screen,\nspecified in `screen` attribute. Could be `String`, `RegExp` or\n`Function`. In case of `Function`, it will receive the URL as\nparameter and it should return true if this URL could be handled by\nthe screen.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_path"
     },
     "screen": {
      "!type": "fn()",
      "!doc": "Defines the screen which will be rendered once a URL in the\napplication matches the path, specified in `path` attribute. Could be\n`A.Screen` or its extension, like `A.HTMLScreen`.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_screen"
     },
     "activate": {
      "!type": "fn()",
      "!doc": "Fires when the screen is active. Allows a screen to perform any setup\nthat requires its DOM to be visible. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_activate"
     },
     "beforeDeactivate": {
      "!type": "fn() -> bool",
      "!doc": "Gives the Screen a chance to cancel the navigation and stop itself from\nbeing deactivated. Can be used, for example, if the screen has unsaved\nstate. Lifecycle.\n\nClean-up should not be preformed here, since the navigation may still be\ncancelled. Do clean-up in deactivate.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_beforeDeactivate"
     },
     "flip": {
      "!type": "fn() -> +Promise",
      "!doc": "Allows a screen to perform any setup immediately before the DOM is\nmade visible. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_flip"
     },
     "deactivate": {
      "!type": "fn()",
      "!doc": "Allows a screen to do any cleanup necessary after it has been\ndeactivated, for example cancelling outstanding XHRs or stopping\ntimers. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_deactivate"
     },
     "destructor": {
      "!type": "fn()",
      "!doc": "Destroys a cacheable screen.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_destructor"
     },
     "getSurfacesContent": {
      "!type": "fn(path: string) -> string",
      "!doc": "Returns all contents for the surfaces. This will pass an `opt_contents`\nto `getSurfaceContent` with all information you need to fulfill the\nsurfaces. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_getSurfacesContent"
     },
     "_setId": {
      "!type": "fn(val: string) -> string",
      "!doc": "Sets the id attribute.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__setId"
     },
     "_valueId": {
      "!type": "fn() -> string",
      "!doc": "Value of the id attribute.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method__valueId"
     },
     "title": {
      "!type": "fn()",
      "!doc": "The document.title to set when the screen is active.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_title"
     },
     "addCache": {
      "!type": "fn(surfaceId: string, content: string)",
      "!doc": "Adds content to the cache.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_addCache"
     },
     "clearCache": {
      "!type": "fn()",
      "!doc": "Clears the cache.",
      "!url": "http://alloyui.com/classes/A.Tab.html#method_clearCache"
     }
    },
    "TRANSITION": {
     "!type": "?",
     "!doc": "Transition function that returns a promise, the navigation will be paused\nuntil all surfaces' promise have completed. This is useful for\nanimations.",
     "!url": "http://alloyui.com/classes/A.Tab.html#property_TRANSITION"
    }
   }
  },
  "aui_tabview": {
   "A.Tab": {
    "!type": "fn(config: Object) -> +aui_tabview.A.Tab",
    "!proto": "Tab",
    "!doc": "A base class for Tab.\n\nCheck the [live demo](http://alloyui.com/examples/tabview/).",
    "!url": "http://alloyui.com/classes/A.Tab.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Tab.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Tab.",
     "!url": "http://alloyui.com/classes/A.Tab.html#property_ATTRS"
    },
    "prototype": {
     "disabled": {
      "!type": "fn()",
      "!doc": "TODO. Wanna help? Please send a Pull Request.",
      "!url": "http://alloyui.com/classes/A.Tab.html#attribute_disabled"
     }
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Tab.html#property_CSS_PREFIX"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.Tab.html#property_EXTENDS"
    }
   },
   "A.TabView": {
    "!type": "fn(config: Object) -> +aui_tabview.A.TabView",
    "!proto": "TabView",
    "!doc": "A base class for TabView.\n\nCheck the [live demo](http://alloyui.com/examples/tabview/).",
    "!url": "http://alloyui.com/classes/A.TabView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_NAME"
    },
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_CSS_PREFIX"
    },
    "prototype": {
     "undefined": {
      "!type": "fn()",
      "!doc": "Constants for available tab view types.",
      "!url": "http://alloyui.com/classes/A.TabView.html"
     },
     "stacked": {
      "!type": "fn()",
      "!doc": "Determine the orientation of tabs.\nCan be stacked (vertical) or not (horizontal).",
      "!url": "http://alloyui.com/classes/A.TabView.html#attribute_stacked"
     },
     "type": {
      "!type": "fn()",
      "!doc": "Determine the type of tabs.",
      "!url": "http://alloyui.com/classes/A.TabView.html#attribute_type"
     },
     "disableTab": {
      "!type": "fn(i)",
      "!doc": "Disable tab based on its index.",
      "!url": "http://alloyui.com/classes/A.TabView.html#method_disableTab"
     },
     "enableTab": {
      "!type": "fn(i)",
      "!doc": "Enable tab based on its index.",
      "!url": "http://alloyui.com/classes/A.TabView.html#method_enableTab"
     },
     "getActiveTab": {
      "!type": "fn()",
      "!doc": "Get the active tab.",
      "!url": "http://alloyui.com/classes/A.TabView.html#method_getActiveTab"
     },
     "getTabs": {
      "!type": "fn()",
      "!doc": "Get the tabs.",
      "!url": "http://alloyui.com/classes/A.TabView.html#method_getTabs"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TabView.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_ATTRS"
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_UI_ATTRS"
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_EXTENDS"
    },
    "AUGMENTS": {
     "!type": "+Array",
     "!doc": "Static property used to define the augmented classes.",
     "!url": "http://alloyui.com/classes/A.TabView.html#property_AUGMENTS"
    }
   }
  },
  "aui_text": {
   "A.TimePickerBase": {
    "!type": "fn(config: Object) -> +aui_timepicker.A.TimePickerBase",
    "!doc": "A base class for `TimePickerBase`.",
    "!url": "http://alloyui.com/classes/A.TimePickerBase.html",
    "prototype": {
     "match": {
      "!type": "fn(str: string, group: string, flags: string)",
      "!doc": "Tests a string against an Unicode pattern. Returns the first match.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_match"
     },
     "test": {
      "!type": "fn(str: string, group: string, flags: string)",
      "!doc": "Tests a string against an Unicode pattern. Returns true or false.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_test"
     }
    }
   }
  },
  "aui_timepicker": {
   "A.TimePickerBase": {
    "!type": "fn(config: Object) -> +aui_timepicker.A.TimePickerBase",
    "!doc": "A base class for `TimePickerBase`.",
    "!url": "http://alloyui.com/classes/A.TimePickerBase.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration for the\n`TimePickerBase`.",
     "!url": "http://alloyui.com/classes/A.TimePickerBase.html#property_ATTRS"
    },
    "prototype": {
     "autocomplete": {
      "!type": "fn()",
      "!doc": "Default `AutoComplete` configuration options.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#attribute_autocomplete"
     },
     "dateSeparator": {
      "!type": "fn()",
      "!doc": "Value seperator for `queryDelimiter` attribute of `AutoComplete` class.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#attribute_dateSeparator"
     },
     "mask": {
      "!type": "fn()",
      "!doc": "Format for displayed time.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#attribute_mask"
     },
     "popoverCssClass": {
      "!type": "fn()",
      "!doc": "CSS class for popover.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#attribute_popoverCssClass"
     },
     "values": {
      "!type": "fn()",
      "!doc": "Time values available to `AutoComplete` instance.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#attribute_values"
     },
     "clearSelection": {
      "!type": "fn()",
      "!doc": "Clears selection.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_clearSelection"
     },
     "getAutoComplete": {
      "!type": "fn(node: aui_node.Node) -> +Object",
      "!doc": "Creates and returns a new instance of `AutoComplete`.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_getAutoComplete"
     },
     "selectDates": {
      "!type": "fn(dates: Object)",
      "!doc": "Sets selected date.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_selectDates"
     },
     "useInputNode": {
      "!type": "fn(node: aui_node.Node)",
      "!doc": "Syncs `TimePicker` values to input node value.",
      "!url": "http://alloyui.com/classes/A.TimePickerBase.html#method_useInputNode"
     }
    }
   }
  },
  "aui_timer": {
   "A.Timer": {
    "!type": "fn() -> +aui_timer.A.Timer",
    "!doc": "A base class for Timer.",
    "!url": "http://alloyui.com/classes/A.Timer.html",
    "prototype": {
     "clearInterval": {
      "!type": "fn(id)",
      "!doc": "Cancels repeated action which was set up using `setInterval` function.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_clearInterval"
     },
     "clearTimeout": {
      "!type": "fn(id)",
      "!doc": "Clears the delay set by `setTimeout` function.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_clearTimeout"
     },
     "intervalTime": {
      "!type": "fn(newInterval) -> number",
      "!doc": "Defines the fixed time delay between each interval.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_intervalTime"
     },
     "isRepeatable": {
      "!type": "fn(task) -> bool",
      "!doc": "Checks if the task is repeatable or not.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_isRepeatable"
     },
     "setTimeout": {
      "!type": "fn(fn, ms, context)",
      "!doc": "Calls a function after a specified delay.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_setTimeout"
     },
     "setInterval": {
      "!type": "fn(fn, ms, context)",
      "!doc": "Calls a function repeatedly, with a fixed time delay between each call to\nthat function.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_setInterval"
     },
     "register": {
      "!type": "fn(repeats, fn, ms, context, args)",
      "!doc": "Adds a new task to the timer.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_register"
     },
     "run": {
      "!type": "fn(task)",
      "!doc": "Runs the task function.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_run"
     },
     "unregister": {
      "!type": "fn(repeats, id)",
      "!doc": "Removes a task from the timer.",
      "!url": "http://alloyui.com/classes/A.Timer.html#method_unregister"
     }
    },
    "A.clearInterval": {
     "!type": "fn(id)",
     "!doc": "Cancels repeated action which was set up using `setInterval` function.",
     "!url": "http://alloyui.com/classes/A.Timer.html#method_A.clearInterval"
    },
    "A.clearTimeout": {
     "!type": "fn(id)",
     "!doc": "Clears the delay set by `setTimeout` function.",
     "!url": "http://alloyui.com/classes/A.Timer.html#method_A.clearTimeout"
    },
    "A.setInterval": {
     "!type": "fn(fn, ms, context)",
     "!doc": "Calls a function repeatedly, with a fixed time delay between each call to\nthat function.",
     "!url": "http://alloyui.com/classes/A.Timer.html#method_A.setInterval"
    },
    "A.setTimeout": {
     "!type": "fn(fn, ms, context)",
     "!doc": "Calls a function after a specified delay.",
     "!url": "http://alloyui.com/classes/A.Timer.html#method_A.setTimeout"
    }
   }
  },
  "aui_toggler": {
   "A.Toggler": {
    "!type": "fn(config: Object) -> +aui_toggler.A.Toggler",
    "!proto": "Base",
    "!doc": "A base class for Toggler.\n\nCheck the [live demo](http://alloyui.com/examples/toggler/).",
    "!url": "http://alloyui.com/classes/A.Toggler.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Toggler.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.Toggler`.",
     "!url": "http://alloyui.com/classes/A.Toggler.html#property_ATTRS"
    },
    "prototype": {
     "animated": {
      "!type": "fn()",
      "!doc": "Determine if the `A.Toggler` transitions will animate.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_animated"
     },
     "animating": {
      "!type": "fn()",
      "!doc": "Determine if the `A.Toggler` transitions are being animated in that\nmoment.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_animating"
     },
     "bindDOMEvents": {
      "!type": "fn()",
      "!doc": "Determine if the `A.Toggler` should bind DOM events or not.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_bindDOMEvents"
     },
     "content": {
      "!type": "fn()",
      "!doc": "The content of a Toogler instance.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_content"
     },
     "expanded": {
      "!type": "fn()",
      "!doc": "Determine if the content starts as toggled on/off on page load.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_expanded"
     },
     "header": {
      "!type": "fn()",
      "!doc": "The header of a Toogler instance.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_header"
     },
     "toggleEvent": {
      "!type": "fn()",
      "!doc": "User interaction that triggers the Toggler instance.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_toggleEvent"
     },
     "transition": {
      "!type": "fn()",
      "!doc": "Transition definitions such as duration and type of easing effect.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#attribute_transition"
     },
     "headerEventHandler": {
      "!type": "fn(event, instance)",
      "!doc": "Handle header events.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_headerEventHandler"
     },
     "animate": {
      "!type": "fn(config, fn)",
      "!doc": "Expand `A.Toggler` with an animation.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_animate"
     },
     "collapse": {
      "!type": "fn()",
      "!doc": "Hide `A.Toggler` content.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_collapse"
     },
     "expand": {
      "!type": "fn()",
      "!doc": "Show `A.Toggler` content.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_expand"
     },
     "getContentHeight": {
      "!type": "fn() -> number",
      "!doc": "Return the height of content.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_getContentHeight"
     },
     "toggle": {
      "!type": "fn(expand)",
      "!doc": "Show or hide content.",
      "!url": "http://alloyui.com/classes/A.Toggler.html#method_toggle"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.Toggler.html#property_EXTENDS"
    }
   },
   "A.TogglerDelegate": {
    "!type": "fn(config: Object) -> +aui_toggler.A.TogglerDelegate",
    "!proto": "Base",
    "!doc": "A base class for Toggler Delegate.\n\nCheck the [live demo](http://alloyui.com/examples/toggler/).",
    "!url": "http://alloyui.com/classes/A.TogglerDelegate.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the `A.TogglerDelegate`.",
     "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#property_ATTRS"
    },
    "prototype": {
     "animated": {
      "!type": "fn()",
      "!doc": "Determine if the `A.TogglerDelegate` transitions will animate.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_animated"
     },
     "closeAllOnExpand": {
      "!type": "fn()",
      "!doc": "Determine if the `A.TogglerDelegate` switches\nwill be set to off when one switch is toggled on.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_closeAllOnExpand"
     },
     "container": {
      "!type": "fn()",
      "!doc": "The container of `A.TogglerDelegate` instance.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_container"
     },
     "content": {
      "!type": "fn()",
      "!doc": "The content of a Toogler Delegate instance.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_content"
     },
     "expanded": {
      "!type": "fn()",
      "!doc": "Determine if the content starts as toggled on/off on page load.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_expanded"
     },
     "header": {
      "!type": "fn()",
      "!doc": "The header of a Toogler Delegate instance.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_header"
     },
     "toggleEvent": {
      "!type": "fn()",
      "!doc": "User interaction that triggers the Toggler instance.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_toggleEvent"
     },
     "transition": {
      "!type": "fn()",
      "!doc": "Transition definitions such as duration and type of easing effect.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#attribute_transition"
     },
     "collapseAll": {
      "!type": "fn()",
      "!doc": "Collapse all items.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#method_collapseAll"
     },
     "createAll": {
      "!type": "fn()",
      "!doc": "Forces toggler creation on delegated header elements.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#method_createAll"
     },
     "expandAll": {
      "!type": "fn()",
      "!doc": "Expand all items.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#method_expandAll"
     },
     "findContentNode": {
      "!type": "fn(header)",
      "!doc": "Return the content node.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#method_findContentNode"
     },
     "headerEventHandler": {
      "!type": "fn(event)",
      "!doc": "Handle header events.",
      "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#method_headerEventHandler"
     }
    },
    "EXTENDS": {
     "!type": "+Object",
     "!doc": "Static property used to define which component it extends.",
     "!url": "http://alloyui.com/classes/A.TogglerDelegate.html#property_EXTENDS"
    }
   }
  },
  "aui_toolbar": {
   "A.Toolbar": {
    "!type": "fn(config: Object) -> +aui_toolbar.A.Toolbar",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Toolbar.\n\nCheck the [live demo](http://alloyui.com/examples/toolbar/).",
    "!url": "http://alloyui.com/classes/A.Toolbar.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Toolbar.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#property_ATTRS"
    },
    "prototype": {
     "children": {
      "!type": "fn()",
      "!doc": "A list of child elements.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#attribute_children"
     },
     "toolbarRenderer": {
      "!type": "fn()",
      "!doc": "Define a new `ToolbarRenderer`.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#attribute_toolbarRenderer"
     },
     "add": {
      "!type": "fn(children, where)",
      "!doc": "Insert children on Toolbar.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#method_add"
     },
     "clear": {
      "!type": "fn()",
      "!doc": "Clear children from Toolbar.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#method_clear"
     },
     "getEnclosingWidget": {
      "!type": "fn(seed)",
      "!doc": "Find the first ancestor node that is a widget bounding box.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#method_getEnclosingWidget"
     },
     "item": {
      "!type": "fn(index)",
      "!doc": "Get a certain item based on its index.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#method_item"
     },
     "remove": {
      "!type": "fn(where)",
      "!doc": "Remove children from Toolbar.",
      "!url": "http://alloyui.com/classes/A.Toolbar.html#method_remove"
     }
    },
    "UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the UI attributes.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#property_UI_ATTRS"
    },
    "A.Toolbar.isSupportedWidget": {
     "!type": "fn(o)",
     "!doc": "Check if type is supported.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#method_A.Toolbar.isSupportedWidget"
    },
    "CONTENT_TEMPLATE": {
     "!type": "?",
     "!doc": "Static property provide a content template.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#property_CONTENT_TEMPLATE"
    },
    "TEMPLATES": {
     "!type": "+Object",
     "!doc": "Static property provide a group of templates.",
     "!url": "http://alloyui.com/classes/A.Toolbar.html#property_TEMPLATES"
    }
   },
   "A.ToolbarRenderer": {
    "!type": "fn(config: Object) -> +aui_toolbar.A.ToolbarRenderer",
    "!doc": "A base class for ToolbarRenderer.\n\nCheck the [live demo](http://alloyui.com/examples/toolbar/).",
    "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html",
    "TEMPLATES": {
     "!type": "+Object",
     "!doc": "Static property provides a set of templates.",
     "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#property_TEMPLATES"
    },
    "RENDERER": {
     "!type": "+Object",
     "!doc": "Static property used to define how\nthings are going to be rendered.",
     "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#property_RENDERER"
    },
    "prototype": {
     "button": {
      "!type": "fn(childRenderHints)",
      "!doc": "Define how a button should be rendered.",
      "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#method_button"
     },
     "group": {
      "!type": "fn(childRenderHints)",
      "!doc": "Define how a group should be rendered.",
      "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#method_group"
     },
     "render": {
      "!type": "fn(children)",
      "!doc": "Render children in a document fragment.",
      "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#method_render"
     },
     "renderNode": {
      "!type": "fn(child)",
      "!doc": "Render node.",
      "!url": "http://alloyui.com/classes/A.ToolbarRenderer.html#method_renderNode"
     }
    }
   }
  },
  "aui_tooltip": {
   "A.Tooltip": {
    "!type": "fn(config: Object) -> +aui_tooltip.A.Tooltip",
    "!proto": "Widget",
    "!doc": "A base class for Tooltip.\n\nCheck the [live demo](http://alloyui.com/examples/tooltip/).",
    "!url": "http://alloyui.com/classes/A.Tooltip.html",
    "CSS_PREFIX": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the CSS prefix.",
     "!url": "http://alloyui.com/classes/A.Tooltip.html#property_CSS_PREFIX"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Tooltip.",
     "!url": "http://alloyui.com/classes/A.Tooltip.html#property_ATTRS"
    },
    "prototype": {
     "animated": {
      "!type": "fn()",
      "!doc": "Determine if the transitions will animate or not.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_animated"
     },
     "bodyContent": {
      "!type": "fn()",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_bodyContent"
     },
     "constrain": {
      "!type": "fn()",
      "!doc": "Determine the tooltip constrain node.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_constrain"
     },
     "footerContent": {
      "!type": "fn()",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_footerContent"
     },
     "formatter": {
      "!type": "fn()",
      "!doc": "Format the title attribute before set the content of the tooltip.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_formatter"
     },
     "headerContent": {
      "!type": "fn()",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_headerContent"
     },
     "html": {
      "!type": "fn()",
      "!doc": "Determines if the tooltip allows arbitary HTML or is plain text.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_html"
     },
     "opacity": {
      "!type": "fn()",
      "!doc": "Determine the opacity.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_opacity"
     },
     "triggerShowEvent": {
      "!type": "fn()",
      "!doc": "DOM event to show the tooltip.",
      "!url": "http://alloyui.com/classes/A.Tooltip.html#attribute_triggerShowEvent"
     }
    },
    "TEMPLATES": {
     "!type": "+Object",
     "!doc": "Static property provides a set of reusable templates.",
     "!url": "http://alloyui.com/classes/A.Tooltip.html#property_TEMPLATES"
    }
   },
   "A.TooltipDelegate": {
    "!type": "fn(config: Object) -> +aui_tooltip.A.TooltipDelegate",
    "!proto": "Base",
    "!doc": "A base class for Toggler Delegate.\n\nCheck the [live demo](http://alloyui.com/examples/tooltip/).",
    "!url": "http://alloyui.com/classes/A.TooltipDelegate.html",
    "prototype": {
     "_onUserHideInteraction": {
      "!type": "fn(event)",
      "!doc": "Show tooltip on user interaction.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#method__onUserHideInteraction"
     },
     "_onUserShowInteraction": {
      "!type": "fn(event)",
      "!doc": "Show tooltip on user interaction.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#method__onUserShowInteraction"
     },
     "align": {
      "!type": "fn()",
      "!doc": "The alignment configuration for this widget.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_align"
     },
     "container": {
      "!type": "fn()",
      "!doc": "The container of Toggler Delegate instance.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_container"
     },
     "duration": {
      "!type": "fn()",
      "!doc": "Determine the duration of the tooltip animation.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_duration"
     },
     "html": {
      "!type": "fn()",
      "!doc": "Determines if the tooltip allows arbitary HTML or is plain text.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_html"
     },
     "opacity": {
      "!type": "fn()",
      "!doc": "Determine the opacity of the tooltip.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_opacity"
     },
     "triggerHideEvent": {
      "!type": "fn()",
      "!doc": "DOM event to hide the tooltip.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_triggerHideEvent"
     },
     "triggerShowEvent": {
      "!type": "fn()",
      "!doc": "DOM event to show the tooltip.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_triggerShowEvent"
     },
     "zIndex": {
      "!type": "fn()",
      "!doc": "Specify the zIndex for the tooltips.",
      "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#attribute_zIndex"
     }
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Toggler Delegate.",
     "!url": "http://alloyui.com/classes/A.TooltipDelegate.html#property_ATTRS"
    }
   }
  },
  "aui_tree": {
   "A.TreeData": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeData",
    "!proto": "Base",
    "!doc": "A base class for TreeData, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Handle the data of the tree\n- Basic DOM implementation (append/remove/insert)\n- Indexing management to handle the children nodes",
    "!url": "http://alloyui.com/classes/A.TreeData.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeData.",
     "!url": "http://alloyui.com/classes/A.TreeData.html#property_ATTRS"
    },
    "prototype": {
     "container": {
      "!type": "fn()",
      "!doc": "Container to nest children nodes. If it has a container it's not a leaf.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#attribute_container"
     },
     "children": {
      "!type": "fn()",
      "!doc": "Array of children (i.e. could be a JSON metadata object or a TreeNode\ninstance).",
      "!url": "http://alloyui.com/classes/A.TreeData.html#attribute_children"
     },
     "index": {
      "!type": "fn()",
      "!doc": "Index the nodes.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#attribute_index"
     },
     "getNodeById": {
      "!type": "fn(uid: string) -> +aui_tree.TreeNode",
      "!doc": "Get a TreeNode by id.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_getNodeById"
     },
     "isRegistered": {
      "!type": "fn(node: aui_tree.TreeNode) -> bool",
      "!doc": "Whether the TreeNode is registered on this TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_isRegistered"
     },
     "updateReferences": {
      "!type": "fn(node: aui_tree.TreeNode, parentNode: aui_tree.TreeNode, ownerTree: TreeView)",
      "!doc": "Update the references of the passed TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_updateReferences"
     },
     "refreshIndex": {
      "!type": "fn()",
      "!doc": "Refresh the index (i.e. re-index all nodes).",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_refreshIndex"
     },
     "registerNode": {
      "!type": "fn(node: aui_tree.TreeNode)",
      "!doc": "Register the passed TreeNode on this TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_registerNode"
     },
     "updateIndex": {
      "!type": "fn(index: Object)",
      "!doc": "Update the [index](A.TreeData.html#attr_index) attribute value.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_updateIndex"
     },
     "unregisterNode": {
      "!type": "fn(node: aui_tree.TreeNode)",
      "!doc": "Unregister the passed TreeNode from this TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_unregisterNode"
     },
     "collapseAll": {
      "!type": "fn()",
      "!doc": "Collapse all children of the TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_collapseAll"
     },
     "expandAll": {
      "!type": "fn()",
      "!doc": "Expand all children of the TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_expandAll"
     },
     "selectAll": {
      "!type": "fn()",
      "!doc": "Select all children of the TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_selectAll"
     },
     "unselectAll": {
      "!type": "fn()",
      "!doc": "Unselect all children of the TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_unselectAll"
     },
     "eachChildren": {
      "!type": "fn(fn: fn(), deep: bool)",
      "!doc": "Loop each children and execute the `fn` callback.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_eachChildren"
     },
     "eachParent": {
      "!type": "fn(fn: fn())",
      "!doc": "Loop each parent node and execute the `fn` callback.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_eachParent"
     },
     "bubbleEvent": {
      "!type": "fn(eventType: string, args: Array, cancelBubbling: bool, stopActionPropagation: bool)",
      "!doc": "Bubble event to all parent nodes.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_bubbleEvent"
     },
     "createNode": {
      "!type": "fn(options: Object) -> +aui_tree.TreeNode",
      "!doc": "Create a TreeNode instance.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_createNode"
     },
     "appendChild": {
      "!type": "fn(node: aui_tree.TreeNode, cancelBubbling: bool)",
      "!doc": "Append a child node to the TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_appendChild"
     },
     "item": {
      "!type": "fn(index: number) -> +aui_tree.TreeNode",
      "!doc": "Get a TreeNode children by index.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_item"
     },
     "indexOf": {
      "!type": "fn(node: aui_tree.TreeNode) -> number",
      "!doc": "Index of the passed TreeNode on the\n[children](A.TreeData.html#attr_children) attribute.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_indexOf"
     },
     "hasChildNodes": {
      "!type": "fn() -> bool",
      "!doc": "Whether the TreeData contains children or not.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_hasChildNodes"
     },
     "getChildren": {
      "!type": "fn(deep: bool) -> +Array",
      "!doc": "Get an Array of the children nodes of the current TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_getChildren"
     },
     "getEventOutputMap": {
      "!type": "fn(node: TreeData) -> +Object",
      "!doc": "Get an object containing metadata for the custom events.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_getEventOutputMap"
     },
     "removeChild": {
      "!type": "fn(node: TreeData)",
      "!doc": "Remove the passed `node` from the current TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_removeChild"
     },
     "_removeChild": {
      "!type": "fn(node: TreeData)",
      "!doc": "Remove the passed `node` from the current TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method__removeChild"
     },
     "empty": {
      "!type": "fn()",
      "!doc": "Delete all children of the current TreeData.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_empty"
     },
     "insert": {
      "!type": "fn(treeNode: aui_tree.TreeNode, refTreeNode: aui_tree.TreeNode, where: aui_tree.TreeNode)",
      "!doc": "Insert `treeNode` before or after the `refTreeNode`.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_insert"
     },
     "insertAfter": {
      "!type": "fn(treeNode: aui_tree.TreeNode, refTreeNode: aui_tree.TreeNode)",
      "!doc": "Insert `treeNode` after the `refTreeNode`.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_insertAfter"
     },
     "insertBefore": {
      "!type": "fn(treeNode: aui_tree.TreeNode, refTreeNode: aui_tree.TreeNode)",
      "!doc": "Insert `treeNode` before the `refTreeNode`.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_insertBefore"
     },
     "getNodeByChild": {
      "!type": "fn(child: aui_node.Node) -> +aui_tree.TreeNode",
      "!doc": "Get a TreeNode instance by a child DOM Node.",
      "!url": "http://alloyui.com/classes/A.TreeData.html#method_getNodeByChild"
     }
    }
   },
   "A.TreeViewIO": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeViewIO",
    "!doc": "A base class for TreeViewIO.",
    "!url": "http://alloyui.com/classes/A.TreeViewIO.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeViewIO.",
     "!url": "http://alloyui.com/classes/A.TreeViewIO.html#property_ATTRS"
    },
    "prototype": {
     "io": {
      "!type": "fn()",
      "!doc": "IO options for the current TreeNode load the children.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#attribute_io"
     },
     "createNodes": {
      "!type": "fn(nodes)",
      "!doc": "Create nodes.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_createNodes"
     },
     "initIO": {
      "!type": "fn()",
      "!doc": "Initialize the IO transaction setup on the\n[io](A.TreeViewIO.html#attr_io) attribute.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_initIO"
     },
     "ioStartHandler": {
      "!type": "fn()",
      "!doc": "IO Start handler.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_ioStartHandler"
     },
     "ioCompleteHandler": {
      "!type": "fn()",
      "!doc": "IO Complete handler.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_ioCompleteHandler"
     },
     "ioSuccessHandler": {
      "!type": "fn()",
      "!doc": "IO Success handler.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_ioSuccessHandler"
     },
     "ioFailureHandler": {
      "!type": "fn()",
      "!doc": "IO Failure handler.",
      "!url": "http://alloyui.com/classes/A.TreeViewIO.html#method_ioFailureHandler"
     }
    }
   },
   "A.TreeNode": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeNode",
    "!proto": "Base",
    "!doc": "A base class for TreeNode, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- The node for the TreeView component\n\nCheck the [live demo](http://alloyui.com/examples/tree/).",
    "!url": "http://alloyui.com/classes/A.TreeNode.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeNode.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeNode.",
     "!url": "http://alloyui.com/classes/A.TreeNode.html#property_ATTRS"
    },
    "prototype": {
     "boundingBox": {
      "!type": "fn()",
      "!doc": "The widget's outermost node, used for sizing and positioning.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_boundingBox"
     },
     "contentBox": {
      "!type": "fn()",
      "!doc": "The direct descendant of a widget's\nbounding box and houses its content.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_contentBox"
     },
     "cssClasses": {
      "!type": "fn()",
      "!doc": "CSS classes used on TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_cssClasses"
     },
     "draggable": {
      "!type": "fn()",
      "!doc": "If true the TreeNode is draggable.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_draggable"
     },
     "ownerTree": {
      "!type": "fn()",
      "!doc": "TreeView which contains the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_ownerTree"
     },
     "label": {
      "!type": "fn()",
      "!doc": "Label of the TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_label"
     },
     "expanded": {
      "!type": "fn()",
      "!doc": "Whether the TreeNode is expanded by default.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_expanded"
     },
     "id": {
      "!type": "fn()",
      "!doc": "Id of the TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_id"
     },
     "leaf": {
      "!type": "fn()",
      "!doc": "Whether the TreeNode could have children or not (i.e. if any\nchildren is present the TreeNode is a leaf).",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_leaf"
     },
     "nextSibling": {
      "!type": "fn()",
      "!doc": "Next sibling of the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_nextSibling"
     },
     "prevSibling": {
      "!type": "fn()",
      "!doc": "Previous sibling of the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_prevSibling"
     },
     "parentNode": {
      "!type": "fn()",
      "!doc": "Parent node of the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_parentNode"
     },
     "labelEl": {
      "!type": "fn()",
      "!doc": "Label element to house the `label` attribute.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_labelEl"
     },
     "hitAreaEl": {
      "!type": "fn()",
      "!doc": "Hitarea element.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_hitAreaEl"
     },
     "alwaysShowHitArea": {
      "!type": "fn()",
      "!doc": "Always show the hitarea icon.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_alwaysShowHitArea"
     },
     "iconEl": {
      "!type": "fn()",
      "!doc": "Icon element.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_iconEl"
     },
     "tabIndex": {
      "!type": "fn()",
      "!doc": "Specify the tab order.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_tabIndex"
     },
     "rendered": {
      "!type": "fn()",
      "!doc": "If true the TreeNode is rendered.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#attribute_rendered"
     },
     "render": {
      "!type": "fn(container)",
      "!doc": "Render TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_render"
     },
     "appendChild": {
      "!type": "fn()",
      "!doc": "Append child on TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_appendChild"
     },
     "collapse": {
      "!type": "fn()",
      "!doc": "Collapse the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_collapse"
     },
     "collapseAll": {
      "!type": "fn()",
      "!doc": "Collapse all TreeNodes.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_collapseAll"
     },
     "contains": {
      "!type": "fn(node: aui_tree.TreeNode) -> bool",
      "!doc": "Check if the current TreeNode contains the passed `node`.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_contains"
     },
     "expand": {
      "!type": "fn()",
      "!doc": "Expand the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_expand"
     },
     "expandAll": {
      "!type": "fn()",
      "!doc": "Expand all TreeNodes.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_expandAll"
     },
     "getDepth": {
      "!type": "fn() -> number",
      "!doc": "Get the depth of the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_getDepth"
     },
     "hasChildNodes": {
      "!type": "fn()",
      "!doc": "Check if it has child nodes.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_hasChildNodes"
     },
     "isSelected": {
      "!type": "fn() -> bool",
      "!doc": "Whether the current TreeNode is selected or not.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_isSelected"
     },
     "isLeaf": {
      "!type": "fn() -> bool",
      "!doc": "Whether the current TreeNode is ancestor of the passed `node` or not.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_isLeaf"
     },
     "toggle": {
      "!type": "fn()",
      "!doc": "Toggle the current TreeNode, `collapsed` or `expanded`.",
      "!url": "http://alloyui.com/classes/A.TreeNode.html#method_toggle"
     }
    }
   },
   "A.TreeNodeIO": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeNodeIO",
    "!proto": "aui_tree.A.TreeNode",
    "!doc": "A base class for TreeNodeIO, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Ajax support to load the children of the current TreeNode",
    "!url": "http://alloyui.com/classes/A.TreeNodeIO.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeNode.",
     "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#property_ATTRS"
    },
    "prototype": {
     "loading": {
      "!type": "fn()",
      "!doc": "Whether the current TreeNode IO transaction is loading.",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#attribute_loading"
     },
     "loaded": {
      "!type": "fn()",
      "!doc": "Whether the current TreeNode has loaded the content.",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#attribute_loaded"
     },
     "cache": {
      "!type": "fn()",
      "!doc": "Whether the current TreeNode should cache the loaded content or not.",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#attribute_cache"
     },
     "leaf": {
      "!type": "fn()",
      "!doc": "Whether the TreeNode could have children or not (i.e. if any\nchildren is present the TreeNode is a leaf).",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#attribute_leaf"
     },
     "expand": {
      "!type": "fn()",
      "!doc": "Expand the current TreeNodeIO.",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#method_expand"
     },
     "_onIOSuccess": {
      "!type": "fn(event)",
      "!doc": "Fire when IO success.",
      "!url": "http://alloyui.com/classes/A.TreeNodeIO.html#method__onIOSuccess"
     }
    }
   },
   "A.TreeNodeCheck": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeNodeCheck",
    "!proto": "aui_tree.A.TreeNodeIO",
    "!doc": "A base class for TreeNodeCheck, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- Checkbox support for the TreeNode",
    "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeNode.",
     "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#property_ATTRS"
    },
    "prototype": {
     "checked": {
      "!type": "fn()",
      "!doc": "Whether the TreeNode is checked or not.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#attribute_checked"
     },
     "checkName": {
      "!type": "fn()",
      "!doc": "Name of the checkbox element used on the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#attribute_checkName"
     },
     "checkContainerEl": {
      "!type": "fn()",
      "!doc": "Container element for the checkbox.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#attribute_checkContainerEl"
     },
     "checkEl": {
      "!type": "fn()",
      "!doc": "Checkbox element.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#attribute_checkEl"
     },
     "check": {
      "!type": "fn()",
      "!doc": "Check the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#method_check"
     },
     "uncheck": {
      "!type": "fn()",
      "!doc": "Uncheck the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#method_uncheck"
     },
     "toggleCheck": {
      "!type": "fn()",
      "!doc": "Toggle the check status of the current TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#method_toggleCheck"
     },
     "isChecked": {
      "!type": "fn() -> ?",
      "!doc": "Whether the current TreeNodeCheck is checked.",
      "!url": "http://alloyui.com/classes/A.TreeNodeCheck.html#method_isChecked"
     }
    }
   },
   "A.TreeNodeTask": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeNodeTask",
    "!proto": "aui_tree.A.TreeNodeCheck",
    "!doc": "A base class for TreeNodeTask, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- 3 states checkbox support\n- Automatic check/uncheck the parent status based on the children checked\n  status",
    "!url": "http://alloyui.com/classes/A.TreeNodeTask.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeNodeTask.html#property_NAME"
    },
    "prototype": {
     "check": {
      "!type": "fn(originalTarget)",
      "!doc": "Check the current TreeNodeTask.",
      "!url": "http://alloyui.com/classes/A.TreeNodeTask.html#method_check"
     },
     "uncheck": {
      "!type": "fn(originalTarget)",
      "!doc": "Uncheck the current TreeNodeTask.",
      "!url": "http://alloyui.com/classes/A.TreeNodeTask.html#method_uncheck"
     }
    }
   },
   "A.TreeNodeRadio": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeNodeRadio",
    "!proto": "aui_tree.A.TreeNodeTask",
    "!doc": "A base class for TreeNodeRadio, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- 3 states checkbox support\n- Automatic check/uncheck the parent status based on the children checked\n  status",
    "!url": "http://alloyui.com/classes/A.TreeNodeRadio.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeNodeRadio.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeNodeRadio.",
     "!url": "http://alloyui.com/classes/A.TreeNodeRadio.html#property_ATTRS"
    },
    "prototype": {
     "cssClasses": {
      "!type": "fn()",
      "!doc": "CSS classes used on TreeNodeRadio.",
      "!url": "http://alloyui.com/classes/A.TreeNodeRadio.html#attribute_cssClasses"
     },
     "check": {
      "!type": "fn()",
      "!doc": "Check the current TreeNodeRadio.",
      "!url": "http://alloyui.com/classes/A.TreeNodeRadio.html#method_check"
     }
    }
   },
   "TreeNode": {
    "!type": "fn()",
    "!url": "http://alloyui.com/classes/TreeNode.html",
    "prototype": {
     "nodeTypes": {
      "!type": "+Object",
      "!doc": "TreeNode types hash map.\n\n```\nA.TreeNode.nodeTypes = {\n radio: A.TreeNodeRadio,\n task: A.TreeNodeTask,\n check: A.TreeNodeCheck,\n node: A.TreeNode,\n io: A.TreeNodeIO\n};\n```",
      "!url": "http://alloyui.com/classes/TreeNode.html#property_nodeTypes"
     }
    }
   },
   "A.TreeViewPaginator": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeViewPaginator",
    "!doc": "A base class for TreeViewPaginator.",
    "!url": "http://alloyui.com/classes/A.TreeViewPaginator.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeView.",
     "!url": "http://alloyui.com/classes/A.TreeViewPaginator.html#property_ATTRS"
    },
    "prototype": {
     "paginator": {
      "!type": "fn()",
      "!doc": "Paginator.",
      "!url": "http://alloyui.com/classes/A.TreeViewPaginator.html#attribute_paginator"
     }
    }
   },
   "A.TreeView": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeView",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for TreeView, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n\nCheck the [live demo](http://alloyui.com/examples/tree/).",
    "!url": "http://alloyui.com/classes/A.TreeView.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeView.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeView.",
     "!url": "http://alloyui.com/classes/A.TreeView.html#property_ATTRS"
    },
    "prototype": {
     "type": {
      "!type": "fn()",
      "!doc": "Type of the treeview (i.e. could be 'file' or 'normal').",
      "!url": "http://alloyui.com/classes/A.TreeView.html#attribute_type"
     },
     "lastSelected": {
      "!type": "fn()",
      "!doc": "Last selected TreeNode.",
      "!url": "http://alloyui.com/classes/A.TreeView.html#attribute_lastSelected"
     },
     "lazyLoad": {
      "!type": "fn()",
      "!doc": "Determine if its going to be lazy loaded or not.",
      "!url": "http://alloyui.com/classes/A.TreeView.html#attribute_lazyLoad"
     },
     "selectOnToggle": {
      "!type": "fn()",
      "!doc": "Determine if its going to be selected on toggle.",
      "!url": "http://alloyui.com/classes/A.TreeView.html#attribute_selectOnToggle"
     }
    }
   },
   "A.TreeViewDD": {
    "!type": "fn(config: Object) -> +aui_tree.A.TreeViewDD",
    "!proto": "aui_tree.A.TreeView",
    "!doc": "A base class for TreeViewDD, providing:\n\n- Widget Lifecycle (initializer, renderUI, bindUI, syncUI, destructor)\n- DragDrop support for the TreeNodes",
    "!url": "http://alloyui.com/classes/A.TreeViewDD.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.TreeViewDD.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the TreeViewDD.",
     "!url": "http://alloyui.com/classes/A.TreeViewDD.html#property_ATTRS"
    },
    "prototype": {
     "helper": {
      "!type": "fn()",
      "!doc": "Dragdrop helper element.",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_helper"
     },
     "scrollDelay": {
      "!type": "fn()",
      "!doc": "Delay of the scroll while dragging the TreeNodes.",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_scrollDelay"
     },
     "dropAction": {
      "!type": "fn()",
      "!doc": "Drop action (i.e. could be 'append', 'below' or 'above').",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_dropAction"
     },
     "lastY": {
      "!type": "fn()",
      "!doc": "Last Y.",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_lastY"
     },
     "node": {
      "!type": "fn()",
      "!doc": "Node.",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_node"
     },
     "nodeContent": {
      "!type": "fn()",
      "!doc": "Reference for the current drop node.",
      "!url": "http://alloyui.com/classes/A.TreeViewDD.html#attribute_nodeContent"
     }
    }
   }
  },
  "aui_undo_redo": {
   "A.Url": {
    "!type": "fn(config: Object) -> +aui_url.A.Url",
    "!doc": "A base class for `A.Url`.\n\nIn order to understand what each attribute/method does,\nyou need to see the anatomy of a URL:\n\n```\n foo://example.com:8042/over/there?name=ferret#nose\n \\_/   \\______________/\\_________/ \\_________/ \\__/\nScheme     Authority       Path       Query   Anchor\n```",
    "!url": "http://alloyui.com/classes/A.Url.html",
    "prototype": {
     "afterRedo": {
      "!type": "fn()",
      "!doc": "Fired after a redo has finished running.",
      "!url": "http://alloyui.com/classes/A.Url.html#event_afterRedo"
     },
     "afterUndo": {
      "!type": "fn()",
      "!doc": "Fired after an undo has finished running.",
      "!url": "http://alloyui.com/classes/A.Url.html#event_afterUndo"
     },
     "beforeRedo": {
      "!type": "fn()",
      "!doc": "Fired right before a redo is run.",
      "!url": "http://alloyui.com/classes/A.Url.html#event_beforeRedo"
     },
     "beforeUndo": {
      "!type": "fn()",
      "!doc": "Fired right before an undo is run.",
      "!url": "http://alloyui.com/classes/A.Url.html#event_beforeUndo"
     },
     "add": {
      "!type": "fn(state: Object)",
      "!doc": "Adds a state to the stack and makes it the current state. Note that all\nstates that could be redone will be removed from the stack after this.\nValid states are objects that have at least 2 functions: undo and redo.\nThese functions can return promises, in which case any subsequent calls\nwill be queued, waiting for all pending promises to end.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_add"
     },
     "canRedo": {
      "!type": "fn() -> bool",
      "!doc": "Checks if it's possible to redo an action.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_canRedo"
     },
     "canUndo": {
      "!type": "fn() -> bool",
      "!doc": "Checks if it's possible to undo an action.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_canUndo"
     },
     "clearHistory": {
      "!type": "fn()",
      "!doc": "Resets the stack, clearing all states and pending actions.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_clearHistory"
     },
     "isActionInProgress": {
      "!type": "fn() -> bool",
      "!doc": "Checks if either an undo or a redo action is currently in progress.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_isActionInProgress"
     },
     "redo": {
      "!type": "fn() -> bool",
      "!doc": "Redoes the next state.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_redo"
     },
     "redoPeek": {
      "!type": "fn() -> bool",
      "!doc": "Returns the state that will be redone when calling redo().",
      "!url": "http://alloyui.com/classes/A.Url.html#method_redoPeek"
     },
     "undo": {
      "!type": "fn() -> bool",
      "!doc": "Undoes the last state.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_undo"
     },
     "undoPeek": {
      "!type": "fn() -> bool",
      "!doc": "Returns the state that will be undone when calling undo().",
      "!url": "http://alloyui.com/classes/A.Url.html#method_undoPeek"
     },
     "maxUndoDepth": {
      "!type": "fn()",
      "!doc": "Limits the states stack size. Useful for memory optimization.",
      "!url": "http://alloyui.com/classes/A.Url.html#attribute_maxUndoDepth"
     },
     "queueable": {
      "!type": "fn()",
      "!doc": "Defines how this module will behave when the user calls undo\nor redo while an action is still in progress. If false, these\ncalls will be ignored. If true, they will be queued, running\nin order as soon as the pending action finishes.",
      "!url": "http://alloyui.com/classes/A.Url.html#attribute_queueable"
     },
     "undefined": {
      "!type": "fn()",
      "!doc": "Appends the given suffix to the string and creates a\nnew state object to represent this.",
      "!url": "http://alloyui.com/classes/A.Url.html"
     }
    }
   }
  },
  "aui_url": {
   "A.Url": {
    "!type": "fn(config: Object) -> +aui_url.A.Url",
    "!doc": "A base class for `A.Url`.\n\nIn order to understand what each attribute/method does,\nyou need to see the anatomy of a URL:\n\n```\n foo://example.com:8042/over/there?name=ferret#nose\n \\_/   \\______________/\\_________/ \\_________/ \\__/\nScheme     Authority       Path       Query   Anchor\n```",
    "!url": "http://alloyui.com/classes/A.Url.html",
    "prototype": {
     "addParameter": {
      "!type": "fn(key, values)",
      "!doc": "Adds a single parameter in the URL.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_addParameter"
     },
     "addParameters": {
      "!type": "fn(parameters)",
      "!doc": "Adds a list of parameters in the URL.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_addParameters"
     },
     "hasParameter": {
      "!type": "fn(key) -> bool",
      "!doc": "Checks if the URL has a parameter.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_hasParameter"
     },
     "getParameter": {
      "!type": "fn(key) -> string",
      "!doc": "Gets a single parameter.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getParameter"
     },
     "getParameters": {
      "!type": "fn() -> +Array",
      "!doc": "Gets a list of parameters.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getParameters"
     },
     "getAnchor": {
      "!type": "fn() -> string",
      "!doc": "Gets the anchor.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getAnchor"
     },
     "getAuthority": {
      "!type": "fn() -> string",
      "!doc": "Gets the authority.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getAuthority"
     },
     "getDirectory": {
      "!type": "fn() -> string",
      "!doc": "Gets the directory.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getDirectory"
     },
     "getFile": {
      "!type": "fn() -> string",
      "!doc": "Gets the file.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getFile"
     },
     "getHost": {
      "!type": "fn() -> string",
      "!doc": "Gets the host.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getHost"
     },
     "getPassword": {
      "!type": "fn() -> string",
      "!doc": "Gets the password.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getPassword"
     },
     "getPath": {
      "!type": "fn() -> string",
      "!doc": "Gets the path.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getPath"
     },
     "getPort": {
      "!type": "fn() -> string",
      "!doc": "Gets the port.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getPort"
     },
     "getProtocol": {
      "!type": "fn() -> string",
      "!doc": "Gets the protocol.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getProtocol"
     },
     "getQuery": {
      "!type": "fn() -> string",
      "!doc": "Gets the query.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getQuery"
     },
     "getRelative": {
      "!type": "fn() -> string",
      "!doc": "Gets the relative.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getRelative"
     },
     "getSource": {
      "!type": "fn() -> string",
      "!doc": "Gets the source.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getSource"
     },
     "getUser": {
      "!type": "fn() -> string",
      "!doc": "Gets the user.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getUser"
     },
     "getUserInfo": {
      "!type": "fn() -> string",
      "!doc": "Gets the user info.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_getUserInfo"
     },
     "removeParameter": {
      "!type": "fn(key)",
      "!doc": "Removes a single parameter from the parameters list.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_removeParameter"
     },
     "removeParameters": {
      "!type": "fn(parameters)",
      "!doc": "Removes a list of parameters from the parameters list.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_removeParameters"
     },
     "setParameter": {
      "!type": "fn(key, opt_values)",
      "!doc": "Sets a single parameter.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setParameter"
     },
     "setParameters": {
      "!type": "fn(parameters)",
      "!doc": "Sets a list of parameters.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setParameters"
     },
     "setAnchor": {
      "!type": "fn(val)",
      "!doc": "Sets the anchor.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setAnchor"
     },
     "setAuthority": {
      "!type": "fn(val)",
      "!doc": "Sets the authority.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setAuthority"
     },
     "setDirectory": {
      "!type": "fn(val)",
      "!doc": "Sets the directory.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setDirectory"
     },
     "setFile": {
      "!type": "fn(val)",
      "!doc": "Sets the file.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setFile"
     },
     "setHost": {
      "!type": "fn(val)",
      "!doc": "Sets the host.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setHost"
     },
     "setPassword": {
      "!type": "fn(val)",
      "!doc": "Sets the password.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setPassword"
     },
     "setPath": {
      "!type": "fn(val)",
      "!doc": "Sets the path.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setPath"
     },
     "setPort": {
      "!type": "fn(val)",
      "!doc": "Sets the port.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setPort"
     },
     "setProtocol": {
      "!type": "fn(val)",
      "!doc": "Sets the protocol.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setProtocol"
     },
     "setRelative": {
      "!type": "fn(val)",
      "!doc": "Sets the relative.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setRelative"
     },
     "setSource": {
      "!type": "fn(val)",
      "!doc": "Sets the source.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setSource"
     },
     "setUser": {
      "!type": "fn(val)",
      "!doc": "Sets the user.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setUser"
     },
     "setUserInfo": {
      "!type": "fn(val)",
      "!doc": "Sets the user info.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_setUserInfo"
     },
     "toString": {
      "!type": "fn() -> string",
      "!doc": "Generates the entire URL based on each attribute.",
      "!url": "http://alloyui.com/classes/A.Url.html#method_toString"
     }
    }
   }
  },
  "aui_video": {
   "A.Video": {
    "!type": "fn(config: Object) -> +aui_video.A.Video",
    "!proto": "aui_component.A.Component",
    "!doc": "A base class for Video.\n\nCheck the [live demo](http://alloyui.com/examples/video/).",
    "!url": "http://alloyui.com/classes/A.Video.html",
    "NAME": {
     "!type": "string",
     "!doc": "Static property provides a string to identify the class.",
     "!url": "http://alloyui.com/classes/A.Video.html#property_NAME"
    },
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Video.",
     "!url": "http://alloyui.com/classes/A.Video.html#property_ATTRS"
    },
    "prototype": {
     "url": {
      "!type": "fn()",
      "!doc": "URL used by Video to play.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_url"
     },
     "ogvUrl": {
      "!type": "fn()",
      "!doc": "URL (on .ogv format) used by Video to play.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_ogvUrl"
     },
     "swfUrl": {
      "!type": "fn()",
      "!doc": "URL (on .swf format) used by Video to create\na fallback player with Flash.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_swfUrl"
     },
     "poster": {
      "!type": "fn()",
      "!doc": "Image displayed before playback starts.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_poster"
     },
     "fixedAttributes": {
      "!type": "fn()",
      "!doc": "An additional list of attributes.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_fixedAttributes"
     },
     "flashPlayerVersion": {
      "!type": "fn()",
      "!doc": "The required Flash version for the swf player",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_flashPlayerVersion"
     },
     "flashVars": {
      "!type": "fn()",
      "!doc": "Variables used by Flash player.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_flashVars"
     },
     "render": {
      "!type": "fn()",
      "!doc": "If `true` the render phase will be automatically invoked\npreventing the `.render()` manual call.",
      "!url": "http://alloyui.com/classes/A.Video.html#attribute_render"
     },
     "load": {
      "!type": "fn()",
      "!doc": "Load video track.",
      "!url": "http://alloyui.com/classes/A.Video.html#method_load"
     },
     "pause": {
      "!type": "fn()",
      "!doc": "Pause video track.",
      "!url": "http://alloyui.com/classes/A.Video.html#method_pause"
     },
     "play": {
      "!type": "fn()",
      "!doc": "Play video track.",
      "!url": "http://alloyui.com/classes/A.Video.html#method_play"
     }
    },
    "BIND_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes\nfor the bindUI lifecycle phase.",
     "!url": "http://alloyui.com/classes/A.Video.html#property_BIND_UI_ATTRS"
    },
    "SYNC_UI_ATTRS": {
     "!type": "+Array",
     "!doc": "Static property used to define the attributes\nfor the syncUI lifecycle phase.",
     "!url": "http://alloyui.com/classes/A.Video.html#property_SYNC_UI_ATTRS"
    }
   }
  },
  "aui_widget_cssclass": {
   "A.WidgetCssClass": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to add cssClass support to the\nbase Widget class, through the [Base.build](Base.html#method_build) method.",
    "!url": "http://alloyui.com/classes/A.WidgetCssClass.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration for the Component.",
     "!url": "http://alloyui.com/classes/A.WidgetCssClass.html#property_ATTRS"
    },
    "prototype": {
     "cssClass": {
      "!type": "fn()",
      "!doc": "CSS class to be automatically added to the `boundingBox`.",
      "!url": "http://alloyui.com/classes/A.WidgetCssClass.html#attribute_cssClass"
     }
    },
    "CSS_CLASS_CONTENT_SUFFIX": {
     "!type": "string",
     "!doc": "Static property used to define the default suffix for cssClass attribute\nvalue applied on `contentBox` node.",
     "!url": "http://alloyui.com/classes/A.WidgetCssClass.html#property_CSS_CLASS_CONTENT_SUFFIX"
    }
   },
   "A.WidgetPositionAlignSuggestion": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to suggest alignment points based on\nposition attribute to base Widget class, through the\n[Base.build](Base.html#method_build) method. It also tries to find\nthe best position in case the widget doesn't fit it's constrainment node.",
    "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration.",
     "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html#property_ATTRS"
    },
    "prototype": {
     "position": {
      "!type": "fn()",
      "!doc": "Determine the position of the tooltip.",
      "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html#attribute_position"
     },
     "POSITION_ALIGN_SUGGESTION": {
      "!type": "+",
      "!doc": "Property defining the align points based on the suggested `position`.",
      "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html#property_POSITION_ALIGN_SUGGESTION"
     },
     "initializer": {
      "!type": "fn()",
      "!doc": "Construction logic executed during WidgetPositionAlignSuggestion\ninstantiation. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html#method_initializer"
     },
     "alignNode": {
      "!type": "fn()",
      "!doc": "Suggest alignment for the node based on the `position` suggestion.",
      "!url": "http://alloyui.com/classes/A.WidgetPositionAlignSuggestion.html#attribute_alignNode"
     }
    }
   }
  },
  "aui_widget_responsive": {
   "A.WidgetResponsive": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to add responsive support to the base\nWidget class, through the [Base.build](Base.html#method_build) method.",
    "!url": "http://alloyui.com/classes/A.WidgetResponsive.html",
    "prototype": {
     "responsive": {
      "!type": "fn()",
      "!doc": "Fired when the widget will be updated to be responsive.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#event_responsive"
     },
     "updateDimensions": {
      "!type": "fn()",
      "!doc": "Updates the widget's dimensions so that it will fit the page better.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#method_updateDimensions"
     },
     "updateDimensionsWithNewRatio": {
      "!type": "fn()",
      "!doc": "Updates the widget's dimensions like the `updateDimensions` method, but\nalso recalculates the ratio to be preserved. Useful if the visible content\nof the widget has changed causing the ratio to change as well.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#method_updateDimensionsWithNewRatio"
     },
     "_canChangeHeight": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the height can be manually changed.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#method__canChangeHeight"
     },
     "_canChangeWidth": {
      "!type": "fn() -> bool",
      "!doc": "Checks if the width can be manually changed.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#method__canChangeWidth"
     },
     "gutter": {
      "!type": "fn()",
      "!doc": "Vertical and horizontal values in pixels that should not be counted\nwhen preserving the widget's ratio. widget.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#attribute_gutter"
     },
     "maxHeight": {
      "!type": "fn()",
      "!doc": "The maximum height of the widget.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#attribute_maxHeight"
     },
     "maxWidth": {
      "!type": "fn()",
      "!doc": "The maximum width of the widget.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#attribute_maxWidth"
     },
     "preserveRatio": {
      "!type": "fn()",
      "!doc": "Flag to indicate if the width/height ratio should be preserved.",
      "!url": "http://alloyui.com/classes/A.WidgetResponsive.html#attribute_preserveRatio"
     }
    }
   }
  },
  "aui_widget_swipe": {
   "A.WidgetToggle": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to add toggle visibility support to the\nbase Widget class, through the [Base.build](Base.html#method_build)\nmethod.",
    "!url": "http://alloyui.com/classes/A.WidgetToggle.html",
    "WIDGET_INDEX_ATTRIBUTE": {
     "!type": "string",
     "!doc": "Static property used to define the `Plugin.ScrollViewPaginator` index\nconfiguration.",
     "!url": "http://alloyui.com/classes/A.WidgetToggle.html#property_WIDGET_INDEX_ATTRIBUTE"
    },
    "WIDGET_ITEM_SELECTOR": {
     "!type": "string",
     "!doc": "Static property used to define the `Plugin.ScrollViewPaginator` selector\nconfiguration.",
     "!url": "http://alloyui.com/classes/A.WidgetToggle.html#property_WIDGET_ITEM_SELECTOR"
    },
    "prototype": {
     "swipe": {
      "!type": "fn()",
      "!doc": "Turns the swipe interaction on/off.",
      "!url": "http://alloyui.com/classes/A.WidgetToggle.html#attribute_swipe"
     },
     "useScrollViewPaginator": {
      "!type": "fn()",
      "!doc": "Flag indicating if ScrollViewPaginator should be plugged.",
      "!url": "http://alloyui.com/classes/A.WidgetToggle.html#attribute_useScrollViewPaginator"
     }
    }
   }
  },
  "aui_widget_toggle": {
   "A.WidgetToggle": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to add toggle visibility support to the\nbase Widget class, through the [Base.build](Base.html#method_build)\nmethod.",
    "!url": "http://alloyui.com/classes/A.WidgetToggle.html",
    "prototype": {
     "toggle": {
      "!type": "fn(visible: bool)",
      "!doc": "Toggles widget visibility.",
      "!url": "http://alloyui.com/classes/A.WidgetToggle.html#method_toggle"
     }
    }
   }
  },
  "aui_widget_toolbars": {
   "A.WidgetToolbars": {
    "!type": "fn() -> +aui_widget_toolbars.A.WidgetToolbars",
    "!doc": "A base class for Widget Toolbars.",
    "!url": "http://alloyui.com/classes/A.WidgetToolbars.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration.",
     "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#property_ATTRS"
    },
    "prototype": {
     "toolbars": {
      "!type": "fn()",
      "!doc": "Collection of `A.Toolbar` instances.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#attribute_toolbars"
     },
     "toolbarPosition": {
      "!type": "fn()",
      "!doc": "Collection of toolbar's header, body, and footer positions.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#attribute_toolbarPosition"
     },
     "toolbarCssClass": {
      "!type": "fn()",
      "!doc": "Collection of toolbar's header, body, and footer CSS classes.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#attribute_toolbarCssClass"
     },
     "addToolbar": {
      "!type": "fn(toolbar, section) -> +aui_toolbar.A.Toolbar",
      "!doc": "Includes a `A.Toolbar` instance into the widget.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#method_addToolbar"
     },
     "getToolbar": {
      "!type": "fn(section) -> +aui_toolbar.A.Toolbar",
      "!doc": "Gets the `A.Toolbar` instance based on its section.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#method_getToolbar"
     },
     "getToolbarSection": {
      "!type": "fn(section) -> string",
      "!doc": "Gets the toolbar's section. If no argument is passed, returns the\n`StdMod.FOOTER`.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#method_getToolbarSection"
     },
     "removeToolbar": {
      "!type": "fn(section)",
      "!doc": "Destroys the `A.Toolbar` instance based on its section.",
      "!url": "http://alloyui.com/classes/A.WidgetToolbars.html#method_removeToolbar"
     }
    }
   }
  },
  "aui_widget_transition": {
   "A.WidgetTransition": {
    "!type": "fn() -> +aui_widget_transition.A.WidgetTransition",
    "!doc": "Widget extension, which can be used to add toggle visibility support to the\nbase Widget class, through the [Base.build](Base.html#method_build)\nmethod.",
    "!url": "http://alloyui.com/classes/A.WidgetTransition.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute configuration.",
     "!url": "http://alloyui.com/classes/A.WidgetTransition.html#property_ATTRS"
    },
    "prototype": {
     "animated": {
      "!type": "fn()",
      "!doc": "Determine if the transitions will animate or not.",
      "!url": "http://alloyui.com/classes/A.WidgetTransition.html#attribute_animated"
     },
     "delay": {
      "!type": "fn()",
      "!doc": "Determine the `delay` (in milliseconds) after widget's transition\nanimation. By default there's no delay. Can pass as parameter\na object `{show: value, hide: value}` or a single value 'Number'.",
      "!url": "http://alloyui.com/classes/A.WidgetTransition.html#attribute_delay"
     },
     "duration": {
      "!type": "fn()",
      "!doc": "Determine the duration of the transition.",
      "!url": "http://alloyui.com/classes/A.WidgetTransition.html#attribute_duration"
     },
     "opacity": {
      "!type": "fn()",
      "!doc": "Determine the opacity.",
      "!url": "http://alloyui.com/classes/A.WidgetTransition.html#attribute_opacity"
     },
     "stickDuration": {
      "!type": "fn()",
      "!doc": "Determine the duration (in milliseconds) for the widget to stick\nvisibility after the trigger element. By default the stick duration is\nnot specified.",
      "!url": "http://alloyui.com/classes/A.WidgetTransition.html#attribute_stickDuration"
     }
    }
   },
   "A.WidgetTrigger": {
    "!type": "fn(The: Object)",
    "!doc": "Widget extension, which can be used to add trigger support to the\nbase Widget class, through the [Base.build](Base.html#method_build) method.",
    "!url": "http://alloyui.com/classes/A.WidgetTrigger.html",
    "ATTRS": {
     "!type": "+Object",
     "!doc": "Static property used to define the default attribute\nconfiguration.",
     "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#property_ATTRS"
    },
    "prototype": {
     "bindDOMEvents": {
      "!type": "fn()",
      "!doc": "Determine if the Toggler should bind DOM events or not.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#attribute_bindDOMEvents"
     },
     "trigger": {
      "!type": "fn()",
      "!doc": "Trigger node to change widget visibility state.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#attribute_trigger"
     },
     "triggerHideEvent": {
      "!type": "fn()",
      "!doc": "DOM event to hide the tooltip.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#attribute_triggerHideEvent"
     },
     "triggerShowEvent": {
      "!type": "fn()",
      "!doc": "DOM event to show the tooltip.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#attribute_triggerShowEvent"
     },
     "triggerToggleEvent": {
      "!type": "fn()",
      "!doc": "DOM event to toggle the tooltip.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#attribute_triggerToggleEvent"
     },
     "initializer": {
      "!type": "fn()",
      "!doc": "Construction logic executed during WidgetTrigger\ninstantiation. Lifecycle.",
      "!url": "http://alloyui.com/classes/A.WidgetTrigger.html#method_initializer"
     }
    }
   }
  },
  "YUI": {
  "!type": "fn(config?: yui.Object) -> +YUI",
  "!doc": "The YUI global namespace object. This is the constructor for all YUI instances.\n\nThis is a self-instantiable factory function, meaning you don't need to precede\nit with the `new` operator. You can invoke it directly like this:\n\n    YUI().use('*', function (Y) {\n        // Y is a new YUI instance.\n    });\n\nBut it also works like this:\n\n    var Y = YUI();\n\nThe `YUI` constructor accepts an optional config object, like this:\n\n    YUI({\n        debug: true,\n        combine: false\n    }).use('node', function (Y) {\n        // Y.Node is ready to use.\n    });\n\nSee the API docs for the <a href=\"config.html\">Config</a> class for the complete\nlist of supported configuration properties accepted by the YUI constuctor.\n\nIf a global `YUI` object is already defined, the existing YUI object will not be\noverwritten, to ensure that defined namespaces are preserved.\n\nEach YUI instance has full custom event support, but only if the event system is\navailable.",
  "!url": "http://alloyui.com/classes/YUI.html",
  "prototype": {
   "cached": {
    "!type": "fn(source: fn(), cache?: yui.Object, refetch?: Any) -> fn()",
    "!doc": "Returns a wrapper for a function which caches the return value of that function,\nkeyed off of the combined string representation of the argument values provided\nwhen the wrapper is called.\n\nCalling this function again with the same arguments will return the cached value\nrather than executing the wrapped function.\n\nNote that since the cache is keyed off of the string representation of arguments\npassed to the wrapper function, arguments that aren't strings and don't provide\na meaningful `toString()` method may result in unexpected caching behavior. For\nexample, the objects `{}` and `{foo: 'bar'}` would both be converted to the\nstring `[object Object]` when used as a cache key.",
    "!url": "http://alloyui.com/classes/YUI.html#method_cached"
   },
   "getLocation": {
    "!type": "fn() -> +Location",
    "!doc": "Returns the `location` object from the window/frame in which this YUI instance\noperates, or `undefined` when executing in a non-browser environment\n(e.g. Node.js).\n\nIt is _not_ recommended to hold references to the `window.location` object\noutside of the scope of a function in which its properties are being accessed or\nits methods are being called. This is because of a nasty bug/issue that exists\nin both Safari and MobileSafari browsers:\n[WebKit Bug 34679](https://bugs.webkit.org/show_bug.cgi?id=34679).",
    "!url": "http://alloyui.com/classes/YUI.html#method_getLocation"
   },
   "merge": {
    "!type": "fn(objects: yui.Object) -> +yui.Object",
    "!doc": "Returns a new object containing all of the properties of all the supplied\nobjects. The properties from later objects will overwrite those in earlier\nobjects.\n\nPassing in a single object will create a shallow copy of it. For a deep copy,\nuse `clone()`.",
    "!url": "http://alloyui.com/classes/YUI.html#method_merge"
   },
   "mix": {
    "!type": "fn(receiver: fn(), supplier: fn(), overwrite?: bool, whitelist?: [string], mode?: number, merge?: bool) -> fn()",
    "!doc": "Mixes _supplier_'s properties into _receiver_.\n\nProperties on _receiver_ or _receiver_'s prototype will not be overwritten or\nshadowed unless the _overwrite_ parameter is `true`, and will not be merged\nunless the _merge_ parameter is `true`.\n\nIn the default mode (0), only properties the supplier owns are copied (prototype\nproperties are not copied). The following copying modes are available:\n\n  * `0`: _Default_. Object to object.\n  * `1`: Prototype to prototype.\n  * `2`: Prototype to prototype and object to object.\n  * `3`: Prototype to object.\n  * `4`: Object to prototype.",
    "!url": "http://alloyui.com/classes/YUI.html#method_mix"
   },
   "later": {
    "!type": "fn(when: number, o, fn: fn(), data, periodic: bool) -> +yui.Object",
    "!doc": "Executes the supplied function in the context of the supplied\nobject 'when' milliseconds later.  Executes the function a\nsingle time unless periodic is set to true.",
    "!url": "http://alloyui.com/classes/YUI.html#method_later"
   },
   "log": {
    "!type": "fn(msg: string, cat: string, src: string, silent: bool) -> +YUI",
    "!doc": "If the 'debug' config is true, a 'yui:log' event will be\ndispatched, which the Console widget and anything else\ncan consume.  If the 'useBrowserConsole' config is true, it will\nwrite to the browser console if available.  YUI-specific log\nmessages will only be present in the -debug versions of the\nJS files.  The build system is supposed to remove log statements\nfrom the raw and minified versions of the files.",
    "!url": "http://alloyui.com/classes/YUI.html#method_log"
   },
   "message": {
    "!type": "fn(msg: string, cat: string, src: string, silent: bool) -> +YUI",
    "!doc": "Write a system message.  This message will be preserved in the\nminified and raw versions of the YUI files, unlike log statements.",
    "!url": "http://alloyui.com/classes/YUI.html#method_message"
   },
   "YUI_config": {
    "!type": "+yui.Object",
    "!doc": "Page-level config applied to all YUI instances created on the\ncurrent page. This is applied after `YUI.GlobalConfig` and before\nany instance-level configuration.",
    "!url": "http://alloyui.com/classes/YUI.html#property_YUI_config"
   },
   "applyConfig": {
    "!type": "fn(o: yui.Object)",
    "!doc": "Applies a new configuration object to the config of this YUI instance. This\nwill merge new group/module definitions, and will also update the loader\ncache if necessary. Updating `Y.config` directly will not update the cache.",
    "!url": "http://alloyui.com/classes/YUI.html#method_applyConfig"
   },
   "version": {
    "!type": "string",
    "!doc": "The version number of this YUI instance.\n\nThis value is typically updated by a script when a YUI release is built,\nso it may not reflect the correct version number when YUI is run from\nthe development source tree.",
    "!url": "http://alloyui.com/classes/YUI.html#property_version"
   },
   "applyTo": {
    "!type": "fn(id: string, method: string, args: yui.Array) -> +Mixed",
    "!doc": "Executes the named method on the specified YUI instance if that method is\nwhitelisted.",
    "!url": "http://alloyui.com/classes/YUI.html#method_applyTo"
   },
   "add": {
    "!type": "fn(name: string, fn: fn(), version: string, config?: yui.Object) -> +YUI",
    "!effects": [
     "custom yui_add"
    ],
    "!doc": "Registers a YUI module and makes it available for use in a `YUI().use()` call or\nas a dependency for other modules.\n\nThe easiest way to create a first-class YUI module is to use\n<a href=\"http://yui.github.com/shifter/\">Shifter</a>, the YUI component build\ntool.\n\nShifter will automatically wrap your module code in a `YUI.add()` call along\nwith any configuration info required for the module.",
    "!url": "http://alloyui.com/classes/YUI.html#method_add"
   },
   "use": {
    "!type": "fn(modules: string, callback?: fn()) -> !this",
    "!effects": [
     "custom yui_use"
    ],
    "!doc": "Attaches one or more modules to this YUI instance. When this is executed,\nthe requirements of the desired modules are analyzed, and one of several\nthings can happen:\n\n\n  * All required modules have already been loaded, and just need to be\n    attached to this YUI instance. In this case, the `use()` callback will\n    be executed synchronously after the modules are attached.\n\n  * One or more modules have not yet been loaded, or the Get utility is not\n    available, or the `bootstrap` config option is `false`. In this case,\n    a warning is issued indicating that modules are missing, but all\n    available modules will still be attached and the `use()` callback will\n    be executed synchronously.\n\n  * One or more modules are missing and the Loader is not available but the\n    Get utility is, and `bootstrap` is not `false`. In this case, the Get\n    utility will be used to load the Loader, and we will then proceed to\n    the following state:\n\n  * One or more modules are missing and the Loader is available. In this\n    case, the Loader will be used to resolve the dependency tree for the\n    missing modules and load them and their dependencies. When the Loader is\n    finished loading modules, the `use()` callback will be executed\n    asynchronously.",
    "!url": "http://alloyui.com/classes/YUI.html#method_use"
   },
   "require": {
    "!type": "fn(modules?: string, callback: fn())",
    "!doc": "Sugar for loading both legacy and ES6-based YUI modules.",
    "!url": "http://alloyui.com/classes/YUI.html#method_require"
   },
   "namespace": {
    "!type": "fn(namespace: string) -> +yui.Object",
    "!doc": "Utility method for safely creating namespaces if they don't already exist.\nMay be called statically on the YUI global object or as a method on a YUI\ninstance.\n\nWhen called statically, a namespace will be created on the YUI global\nobject:\n\n    // Create `YUI.your.namespace.here` as nested objects, preserving any\n    // objects that already exist instead of overwriting them.\n    YUI.namespace('your.namespace.here');\n\nWhen called as a method on a YUI instance, a namespace will be created on\nthat instance:\n\n    // Creates `Y.property.package`.\n    Y.namespace('property.package');\n\nDots in the input string cause `namespace` to create nested objects for each\ntoken. If any part of the requested namespace already exists, the current\nobject will be left in place and will not be overwritten. This allows\nmultiple calls to `namespace` to preserve existing namespaced properties.\n\nIf the first token in the namespace string is \"YAHOO\", that token is\ndiscarded. This is legacy behavior for backwards compatibility with YUI 2.\n\nBe careful with namespace tokens. Reserved words may work in some browsers\nand not others. For instance, the following will fail in some browsers\nbecause the supported version of JavaScript reserves the word \"long\":\n\n    Y.namespace('really.long.nested.namespace');\n\nNote: If you pass multiple arguments to create multiple namespaces, only the\nlast one created is returned from this function.",
    "!url": "http://alloyui.com/classes/YUI.html#method_namespace"
   },
   "error": {
    "!type": "fn(msg: string, e?: Error, src?: string) -> !this",
    "!doc": "Reports an error.\n\nThe reporting mechanism is controlled by the `throwFail` configuration\nattribute. If `throwFail` is falsy, the message is logged. If `throwFail` is\ntruthy, a JS exception is thrown.\n\nIf an `errorFn` is specified in the config it must return `true` to indicate\nthat the exception was handled and keep it from being thrown.",
    "!url": "http://alloyui.com/classes/YUI.html#method_error"
   },
   "guid": {
    "!type": "fn(pre?: string) -> string",
    "!doc": "Generates an id string that is unique among all YUI instances in this\nexecution context.",
    "!url": "http://alloyui.com/classes/YUI.html#method_guid"
   },
   "stamp": {
    "!type": "fn(o: yui.Object, readOnly: bool) -> string",
    "!doc": "Returns a unique id associated with the given object and (if *readOnly* is\nfalsy) stamps the object with that id so it can be identified in the future.\n\nStamping an object involves adding a `_yuid` property to it that contains\nthe object's id. One exception to this is that in Internet Explorer, DOM\nnodes have a `uniqueID` property that contains a browser-generated unique\nid, which will be used instead of a YUI-generated id when available.",
    "!url": "http://alloyui.com/classes/YUI.html#method_stamp"
   },
   "destroy": {
    "!type": "fn()",
    "!doc": "Destroys this YUI instance.",
    "!url": "http://alloyui.com/classes/YUI.html#method_destroy"
   },
   "instanceOf": {
    "!type": "fn(o: yui.Object, type: yui.Object)",
    "!doc": "Safe `instanceof` wrapper that works around a memory leak in IE when the\nobject being tested is `window` or `document`.\n\nUnless you are testing objects that may be `window` or `document`, you\nshould use the native `instanceof` operator instead of this method.",
    "!url": "http://alloyui.com/classes/YUI.html#method_instanceOf"
   },
   "throttle": {
    "!type": "fn(fn: fn(), ms: number) -> fn()",
    "!doc": "Throttles a call to a method based on the time between calls.",
    "!url": "http://alloyui.com/classes/YUI.html#method_throttle"
   }
  },
  "GlobalConfig": {
   "!type": "+yui.Object",
   "!doc": "Master configuration that might span multiple contexts in a non-\nbrowser environment. It is applied first to all instances in all\ncontexts.",
   "!url": "http://alloyui.com/classes/YUI.html#property_GlobalConfig"
  },
  "applyConfig": {
   "!type": "fn(o: yui.Object)",
   "!doc": "Applies a configuration to all YUI instances in this execution context.\n\nThe main use case for this method is in \"mashups\" where several third-party\nscripts need to write to a global YUI config, but cannot share a single\ncentrally-managed config object. This way they can all call\n`YUI.applyConfig({})` instead of overwriting the single global config.",
   "!url": "http://alloyui.com/classes/YUI.html#method_applyConfig"
  },
  "setLoadHook": {
   "!type": "fn(fn: fn())",
   "!doc": "Set a method to be called when `Get.script` is called in Node.js\n`Get` will open the file, then pass it's content and it's path\nto this method before attaching it. Commonly used for code coverage\ninstrumentation. <strong>Calling this multiple times will only\nattach the last hook method</strong>. This method is only\navailable in Node.js.",
   "!url": "http://alloyui.com/classes/YUI.html#method_setLoadHook"
  }
 }
}
});
