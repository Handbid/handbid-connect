define(['altair/facades/declare', 'lodash'], function (declare, _) {

    return declare(null, {

        _req:        null, //the native express request (will need to be decoupled in the future)
        _overrides:  {},
        constructor: function (req) {
            this._req = req;
        },

        get: function (name, defaultValue) {

            var v = _.has(this._overrides, name) ? this._overrides[name] : this._req.param(name);

            if (_.isUndefined(v)) {
                v = defaultValue;
            }

            return v;
        },

        post: function () {
            return this._req.body;
        },

        query: function () {
            return this._req.query;
        },

        set: function (name, value) {

            this._overrides[name] = value;

            return this;

        },

        raw: function () {
            "use strict";
            return this._req;
        },

        isXhr: function () {
            return this._req.xhr;
        },

        method: function () {
            return this._req.method;
        },

        header: function (named, defaultValue) {

            if(named) {
                named = named.toLowerCase();
            }

            return _.has(this._req.headers, named) ? this._req.headers[named] : defaultValue;
        }


    });

});
