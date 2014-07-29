define(['altair/facades/declare',
        'altair/Lifecycle',
        'lodash',
        'altair/events/Emitter'
], function (declare,
             Lifecycle,
             _,
             Emitter) {


    return declare([Lifecycle, Emitter], {

        startup: function () {

            this.on('titan:Alfred::register-server-strategies').then(this.hitch('registerServerStrategies'));

            return this.inherited(arguments);
        },

        /**
         * Report back our server strategies. we do not instantiate them
         *
         * @param e
         * @returns {*|Promise}
         */
        registerServerStrategies: function (e) {

            return this.parseConfig('configs/web-server-strategies').then(this.hitch(function (strategies) {

                _.each(strategies, function (strategy, index, strategies) {
                    if(strategy.search(':') === -1) {
                        strategies[index] = this.name + '/' + strategy;
                    }
                }, this);

                return strategies;

            })).otherwise(this.hitch(function (err) {
                this.log(err);
                this.log(new Error('You must create a valid ' + this.dir + '/configs/web-server-strategies for _HasServerStrategiesMixin to work ' + this));
            }));

        }

    });

});
