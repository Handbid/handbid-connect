define(['altair/facades/declare',
        'altair/facades/mixin',
        'altair/facades/when',
        'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              mixin,
              when,
              _Base) {

        return declare([_Base], {

            name:       'widget-render',
            _handles:   ['widget'],
            extend: function (Module) {

                Module.extendOnce({
                    context: function (options, config) {
                        return this.getValues(options || {}, config || {'methods': ['toViewValue', 'toJsValue']});
                    }
                });

                if(!Module.prototype.__hasWidgetRenderBeenExtended) {

                    Module.prototype.__hasWidgetRenderBeenExtended = true;

                    Module.extendBefore({
                        render: function (path, context, options, old) {

                            var dfd, _context;

                            if(!path) {
                                path = 'views/layout.ejs';
                            }

                            //is there a context()
                            if(this.context) {

                                dfd = this.context();

                            } else {

                                dfd = {};

                            }

                            return when(dfd).then(this.hitch(function (viewValues) {

                                _context =  mixin(context || {}, viewValues);

                                return this.nexus('liquidfire:Onyx').emit('will-render-widget', {
                                    context:    _context,
                                    widget:     this,
                                    view:       path,
                                    options:    options
                                });

                            })).then(function (e) {

                                return when(old(e.get('view'), e.get('context'), e.get('options')));

                            }).then(this.hitch(function (markup) {

                                return this.nexus('liquidfire:Onyx').emit('did-render-widget', {
                                    context:    _context,
                                    widget:     this,
                                    view:       path,
                                    options:    options,
                                    markup:     markup
                                });

                            })).then(function (e) {

                                return e.get('markup');

                            });

                        }
                    });

                }

                return this.inherited(arguments);
            }

        });


    });