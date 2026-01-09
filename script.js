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

        if (typeof(APP.data.current_card) != 'undefined' && APP.getWidgetsArea() == 'leads_card'){
          if (APP.data.current_card.id != 0){
            self.log.info('Запускаем логику загрузки данных...');
            var lead_id = APP.data.current_card.id;

            //запрос данных сделки
            self.$authorizedAjax({
              url: '/api/v4/leads/' + lead_id,
              method: 'GET',
              data: {
                with: 'contacts'
              }
              }).done(function (response) {
                self.log.info('Данные сделки получены');
                self.log.debug('Данные сделки:', response);

                var currentLead = response;
                var dealId = currentLead.id;
                var dealPrice = currentLead.price;
                self.log.info('ID сделки:', dealId, 'Бюджет:', dealPrice);

                if (response._embedded && response._embedded.contacts.length > 0){
                  var contactId = response._embedded.contacts[0].id;
                   self.log.info('Найден ID контакта:', contactId);
                  //запрос данных контакта
                  self.$authorizedAjax({
                    url: '/api/v4/contacts/' + contactId,
                    method: 'GET'
                  }).done(function (contactData) {
                    self.log.info('Ответ по контакту получен:', contactData);
                    var sourceValue = 'Не указан';
                    if (contactData.custom_fields_values) {
                      var sourceField = contactData.custom_fields_values.find(function(field) {
                        return field.field_name === 'Источник';
                      });
                      if (sourceField && sourceField.values && sourceField.values.length > 0) {
                        sourceValue = sourceField.values[0].value;
                      }
                    }
                    self.log.info('ID контакта:', contactData.id);
                    self.log.info('Имя контакта:', contactData.name);
                    self.log.info('Источник контакта:', sourceValue);

                  }).fail(function(err){
                    self.log.error('Ошибка при запросе контакта:', err);
                  })
                } else {
                  self.log.warn('У этой сделки нет привязанных контактов.');
                }

              }).fail(function (err) {
                self.log.error('Ошибка AJAX:', err);
              });

          } else{
            self.log.warn('Режим создания новой сделки. Данные недоступны.');
          }
        } else{
          self.log.warn('Виджет запущен вне контекста карточки сделки');
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