define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
  var CustomWidget = function () {
    var self = this;

    this.callbacks = {
      render: function () {
        console.log('✓ Widget: render callback called');
        console.log('Widget code:', self.get_settings().widget_code);
        console.log('Widget params:', self.params);
        return true;
      },
      bind_actions: function() {
        console.log('✓ Widget: bind_actions callback called');
        return true;
      },
      init: function() {
        console.log('✓ Widget: init callback called');
        return true;
      },
      settings: function () {
        // ...
      },
      onSave: function () {
        return true;
      },
      destroy: function () {
        // ...
      }
    };
    return this;
  };

  return CustomWidget;
});