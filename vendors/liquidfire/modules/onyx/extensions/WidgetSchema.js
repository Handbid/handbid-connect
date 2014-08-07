define(['altair/facades/declare',
    'altair/cartridges/extension/extensions/_Base'],

    function (declare,
              _Base) {

        return declare([_Base], {

            name: 'widget-schema',
            _foundry: null,
            _handles: ['widget'],

            extend: function (Module) {

                Module.extendOnce({
                    schemaPath: 'configs/schema'
                });

                return this.inherited(arguments);
            }

        });


    });