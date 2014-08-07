define(['altair/facades/declare',
        'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              _Base) {

        return declare([_Base], {

            name: 'render',
            extend: function (Module) {

                Module.extendOnce({
                    viewPath: 'views',
                    render: function (path, context, options) {

                        if(!path) {
                            throw new Error('you need to pass a path to render()');
                        }

                        var _p = this.resolvePath(path);

                        return this.nexus('liquidfire:Onyx').render(_p, context, options);

                    }
                });

                return this.inherited(arguments);
            }

        });


    });