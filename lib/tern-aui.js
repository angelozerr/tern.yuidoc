(function() {
  "use strict";

  var AUI = TernYUIDoc.AUI = {};

  AUI.generate = function(yuiDoc) {
    var options = {
      "name" : "aui",
      "getEffects" : getEffects,
      "getType" : getType,
      "baseURL" : "http://alloyui.com/"
    };
    return TernYUIDoc.generate(yuiDoc, options);
  }

  function getEffects(moduleName, className, name, yuiClassitem) {
    if (moduleName === 'yui' && className === 'YUI') {
      if (name === 'add')
        return 'custom yui_add';
      if (name === 'use')
        return 'custom yui_use';
    }
  }

  function getType(moduleName, className, name, yuiClassitem) {
    if (moduleName === 'node' && className === 'Node' && name == 'on') {
      // fn(type: string, fn: fn(), context?: yui.Object, arg?: Any) ->
      // +event_custom.EventHandle
      return 'fn(type: string, fn: fn(e: +event.DOMEventFacade), context?: ?, arg?: ?) -> +event_custom.EventHandle';
    }
  }

})();