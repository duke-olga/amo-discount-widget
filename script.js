define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
  var CustomWidget = function () {
    var self = this;

    // логгер с уровнями
    this.log = {
      // основная информация о работе виджета
      info: function(...args) {
        if (self.params && self.params.id) {
          console.info(`[Widget ${self.params.id}] [INFO]`, ...args);
        } else {
          console.info('[Widget unknown] [INFO]', ...args);
        }
      },
      // детали во время разработки 
      debug: function(...args) {
        if (self.params && self.params.id) {
          console.debug(`[Widget ${self.params.id}] [DEBUG]`, ...args);
        } else {
          console.debug('[Widget unknown] [DEBUG]', ...args);
        }
      },
      // предупреждения
      warn: function(...args) {
        if (self.params && self.params.id) {
          console.warn(`[Widget ${self.params.id}] [WARN]`, ...args);
        } else {
          console.warn('[Widget unknown] [WARN]', ...args);
        }
      },
      // ошибки
      error: function(...args) {
        if (self.params && self.params.id) {
          console.error(`[Widget ${self.params.id}] [ERROR]`, ...args);
        } else {
          console.error('[Widget unknown] [ERROR]', ...args);
        }
      },
      // ошибки с трассировкой
      traceError: function(e, ...args) {
        this.error(...args, e);
        console.trace(e);
      }
    };

    this.callbacks = {
      render: function () {
        self.log.info('✓ render callback called');
        try {
          self.log.debug('Widget params:', self.params);
          self.log.debug('Widget settings:', self.get_settings());
        } catch (e) {
          self.log.traceError(e, 'Ошибка при рендере виджета');
        }

        self.render_template({
          caption: {
            class_name: 'discount-widget-caption'
          },
          body: '<div class="discount-widget-body">Привет! Я виджет скидок.</div>',
          render: ''
        });

        return true;
      },
      bind_actions: function() {
        self.log.info('✓ bind_actions callback called');
        return true;
      },
      init: function() {
        self.log.info('✓ init callback called');
        try {
          var cssUrl = self.params.path + '/style.css?v=' + self.params.version;

          if ($('link[href="' + cssUrl + '"]').length === 0) {
            $('head').append(
              '<link rel="stylesheet" type="text/css" href="' + cssUrl + '">'
            );
            self.log.info('CSS подключён:', cssUrl);
          } else {
            self.log.debug('CSS уже подключён');
          }
        } catch (e) {
          self.log.traceError(e, 'Ошибка подключения CSS');
        }

        if (!self.params.id) {
          self.log.warn('Параметр id не задан — фильтрация логов будет невозможна');
        }
        return true;
      },
      settings: function () {
        self.log.info('settings callback called');
        // ...
      },
      onSave: function () {
        self.log.info('onSave callback called');
        return true;
      },
      destroy: function () {
        self.log.info('destroy callback called');
        // ...
      }
    };
    return this;
  };

  return CustomWidget;
});