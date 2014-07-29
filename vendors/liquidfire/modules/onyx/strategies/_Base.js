define(['altair/facades/declare'
], function (declare) {

    return declare(null, {

        render: function (path, context, options) {
            throw new Error('your strategy ' + this + ' needs to implement render(path, context, options) and return a Deferred');
        },

        /**
         * Tell Onyx if you can render this type of file
         *
         * @param extension
         * @returns {boolean}
         */
        canRender: function (extension) {
            return false;
        }

    });

});
