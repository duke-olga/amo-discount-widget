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
          self.log.debug('Widget code:', self.get_settings().widget_code);
          self.log.debug('Widget params:', self.params);
          self.log.debug('Widget settings:', self.get_settings());
        } catch (e) {
          self.log.traceError(e, 'Ошибка при рендере виджета');
        }
        return true;
      },
      bind_actions: function() {
        self.log.info('✓ bind_actions callback called');
        return true;
      },
      init: function() {
        self.log.info('✓ init callback called');
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