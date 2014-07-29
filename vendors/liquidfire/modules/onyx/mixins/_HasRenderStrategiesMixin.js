define(['altair/facades/declare',
        'altair/Lifecycle',
        'lodash',
        'altair/facades/all',
        'altair/events/Emitter'
], function (declare,
             Lifecycle,
             _,
             all,
             Emitter) {


    return declare([Lifecycle, Emitter], {

        startup: function () {

            //listen for render strategy event
            this.on('liquidfire:Onyx::register-render-strategies').then(this.hitch('registerRenderStrategies'));

            return this.inherited(arguments);
        },

        /**
         * All our render strategies started up and ready to go (how onyx prefers them)
         *
         * @param e
         * @returns {altair.Deferred}
         */
        registerRenderStrategies: function (e) {

            return this.parseConfig('configs/view-render-strategies').then(this.hitch(function (strategies) {

                var _strategies = [];

                _.each(strategies, function (strategy) {

                    var name = strategy;

                    if(name.search(':') === -1) {
                        name = this.name + '/' + strategy;
                    }

                    _strategies.push(this.forge(name, e.get('options')));

                }, this);

                return all(_strategies);

            })).otherwise(this.hitch(function (err) {
                this.log(err);
                this.log(new Error('You must create a valid ' + this.dir + '/configs/web-render-strategies for _HasRenderStrategiesMixin to work ' + this));
                return err;
            }));

        }

    });

});
