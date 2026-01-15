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


     this.loadDealData = function(lead_id) {
      self.log.info('Запускаем логику загрузки данных...');
      $('#w-deal-name').text('Обновление...');
      $('#w-deal-price').text('...');
      $('#w-client-name').text('...');
      $('#w-client-source').text('...');

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
          self.dealData = response;

          var currentLead = response;
          var dealId = currentLead.id;
          var dealName = response.name || 'Без названия';
          var dealPrice = currentLead.price;
          self.log.info('ID сделки:', dealId,'Название сделки:', dealName, 'Бюджет:', dealPrice);

          $('#w-deal-name').text(dealName);
          $('#w-deal-price').text(dealPrice);

          if (response._embedded && response._embedded.contacts.length > 0){
            var contactId = response._embedded.contacts[0].id;
            self.log.info('Найден ID контакта:', contactId);
            //запрос данных контакта
            self.$authorizedAjax({
              url: '/api/v4/contacts/' + contactId,
              method: 'GET'
            }).done(function (contactData) {
              self.log.info('Ответ по контакту получен:', contactData);
              self.contactData = contactData;

              var clientName = contactData.name || 'Не указан';
              $('#w-client-name').text(clientName);

              var sourceValue = 'Не указан';
              if (contactData.custom_fields_values) {
                var sourceField = contactData.custom_fields_values.find(function(field) {
                  return field.field_name === 'Источник';
                });
                if (sourceField && sourceField.values && sourceField.values.length > 0) {
                  sourceValue = sourceField.values[0].value;
                }
              }

              $('#w-client-source').text(sourceValue);

              self.log.info('ID контакта:', contactData.id);
              self.log.info('Имя контакта:', contactData.name);
              self.log.info('Источник контакта:', sourceValue);

            }).fail(function(err){
              self.log.error('Ошибка при запросе контакта:', err);
              $('#w-client-name').text('Ошибка загрузки');
              $('#w-client-source').text('-');
            })
          } else {
            self.log.warn('У этой сделки нет привязанных контактов.');
            $('#w-client-name').text('Нет контакта');
            $('#w-client-source').text('-');
          }

        }).fail(function (err) {
          self.log.error('Ошибка AJAX:', err);
          $('#w-deal-name').text('Ошибка AJAX');
          $('#w-deal-price').text('-');
        });
     }


    this.callbacks = {
      render: function () {
        self.log.info('✓ render callback called');
        try {
          self.log.debug('Widget params:', self.params);
          self.log.debug('Widget settings:', self.get_settings());
        } catch (e) {
          self.log.traceError(e, 'Ошибка при рендере виджета');
        }


        self.render({
          href: '/templates/card.twig',
          base_path: self.params.path,
          v: self.get_version(),
          load: function (template) {
            var bodyHtml = template.render({
              deal_name: 'Загрузка...',
              deal_price: '...',
              client_name: '...',
              client_source: '...'
            });
            self.render_template({
              caption: {
                class_name: 'discount-widget-caption'
              },
              body: bodyHtml,
              render: ''
            });
          }
        });

        return true;
      },
      bind_actions: function() {
        self.log.info('✓ bind_actions callback called');
        
        try {
            // подключаемся к "ушам" родительского окна (Дома)
            var parentJQuery = window.parent.jQuery;
            var parentDocument = window.parent.document;

            if (parentJQuery && parentDocument) {
                self.log.info('Подключаемся к AJAX главного окна...');
                // вешаем обработчик на родительский документ
                parentJQuery(parentDocument).on('ajaxComplete.myWidgetUpdate', function(events, xhr, settings) {
                    // если объекта settings нет (редкий случай), выходим
                    if (!settings || !settings.url) return;

                    var url = settings.url;
                    // URL, при которых нужно обновлять данные
                    // А) Сохранение сделки
                    var isDealSave = url.indexOf('/ajax/leads/detail/') !== -1;
                    // Б) Удаление контакта (что вы нашли: /ajax/linked/leads/remove/)
                    var isContactRemove = url.indexOf('/ajax/linked/leads/remove/') !== -1;
                    // В) Добавление контакта (что вы нашли: /private/ajax/contacts/add_person/)
                    var isContactAdd = url.indexOf('/contacts/add_person/') !== -1;

                    // если совпало ЛЮБОЕ из условий - обновляем виджет
                    if (isDealSave || isContactRemove || isContactAdd) {
                        // проверяем, что запрос прошел успешно
                        if (xhr && xhr.status === 200) {
                            self.log.info('[AJAX Interceptor] Сработало событие:', url);
                            self.log.info('[AJAX Interceptor] Обновляем данные виджета...');
                            // запускаем обновление
                            var lead_id = APP.data.current_card.id;
                            if (lead_id && lead_id != 0) {
                                self.loadDealData(lead_id);
                            }
                        }
                    }
                });

            } else {
                self.log.warn('Не удалось получить доступ к главному окну (Parent Window).');
            }

        } catch (e) {
            self.log.error('Ошибка при попытке перехвата AJAX родительского окна:', e);
        }

        return true;
      },
      init: function() {
        self.log.info('✓ init callback called');
        // подключение CSS
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
            var lead_id = APP.data.current_card.id;
            self.loadDealData(lead_id);

          } else{
            self.log.warn('Режим создания новой сделки. Данные недоступны.');
            $('#w-deal-name').text('Новая сделка');
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
      advancedSettings: function () {
        self.log.info('advancedSettings callback called');
        $('#page_holder').html('Настройки виджета здесь');

         self.render({
            href: '/templates/advanced.twig',
            base_path: self.params.path,
            v: self.get_version(),       // <--- Добавляем версию для сброса кэша
            promised: true               // <--- Важно, чтобы работала конструкция .then()
        }).then(function (template) {    // <--- Обрати внимание: (template) обязателен здесь!
            
            // template.render({}) возвращает строку HTML
            $('#list_page_holder').html(template.render({}));
            
        });

        return true;
      },
      destroy: function () {
        self.log.info('destroy callback called');
        
        try {
            var parentJQuery = window.parent.jQuery;
            var parentDocument = window.parent.document;

            if (parentJQuery && parentDocument) {
                // Удаляем обработчик с РОДИТЕЛЬСКОГО документа
                parentJQuery(parentDocument).off('ajaxComplete.myWidgetUpdate');
                self.log.info('Слушатель AJAX главного окна удален.');
            }
        } catch (e) {
            self.log.error('Ошибка при удалении слушателя:', e);
        }

        if (self.subscription) {
            self.subscription();
        }
      }
    };
    return this;
  };

  return CustomWidget;
});