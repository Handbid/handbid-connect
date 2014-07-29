define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        /**
         * Setup your admin controller
         *
         * @param options
         * @returns {*}
         */
        startup: function (options) {

            return this.inherited(arguments);

        }

    });

});