define(['altair/facades/declare',
        'lodash',
        'altair/facades/all',
        'altair/facades/when'
], function (declare,
             _,
             all,
             when) {

    "use strict";

    return declare(null, {

        _renderer: null,
        _extensions: null,
        _items: null,
        _basePath: null,


        constructor: function (basePath, renderer) {

            this._renderer = renderer;
            this._items    = [];
            this._basePath = basePath;

            if(!basePath) {
                throw new Error('A basePath is required for your theme\'s head tags.');
            }

            if(!renderer) {
                throw new Error('A renderer is required for your theme\'s head tags.');
            }

        },

        /**
         * Do we handle this type of item?
         *
         * @param item assumed to be path to file
         * @returns {boolean}
         */
        handles: function (item) {
            var ext = item.split('.').pop();
            return _.indexOf(this._extensions, ext) !== -1;
        },

        append: function (item) {

            this._items.push(item);

            return this;
        },

        renderItem: function (item) {
            return '<not-implemented>' + item + '</not-implemented>';
        },

        render: function () {

            var list = _.map(this._items, function (item) {
                return when(this.renderItem(item));
            }, this);

            return all(list).then(function (results) {
                return results.join('\n');
            });
        }

    });

});