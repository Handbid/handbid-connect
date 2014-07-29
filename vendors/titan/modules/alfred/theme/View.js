define(['altair/facades/declare',
    './head/Script',
    './head/Link',
    'lodash',
    'altair/facades/mixin'
], function (declare,
             HeadScript,
             HeadLink,
             _,
             mixin) {

    "use strict";

    return declare(null, {

        _path:          null,
        _renderer:      null,
        _context:       null,

        constructor: function (path, renderer, context) {

            this._path          = path;
            this._renderer      = renderer;
            this._context       = context || {};


            if(!this._path || !this._renderer) {
                throw new Error('You must supply a path and a renderer to every view.');
            }
        },

        set: function (name, value) {
            this._context[name] = value;
        },

        get: function (name, defaultValue) {
            return (_.has(this._context, name)) ? this._context[name] : defaultValue;
        },

        /**
         * Override the path to this view script
         *
         * @param path
         * @returns {this}
         */
        setPath: function (path) {
            this._path = path;
            return this;
        },

        /**
         * Renders my view script
         *
         * @param context
         * @param options
         *
         * @returns {altair.Deferred}
         */
        render: function (context, options) {

            var _context = mixin(this._context || {}, context || {});

            return this._renderer.render(this._path, _context, options);

        }


    });

});