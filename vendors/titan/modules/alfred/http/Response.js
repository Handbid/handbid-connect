define(['altair/facades/declare', 'lodash'], function (declare, _) {

    return declare(null, {

        _res:        null, //the native express response (will need to be decoupled in the future)
        _overrides:  {},
        constructor: function (res) {
            this._res = res;
        },

        send: function (content) {
            return this._res.send(content);
        },

        setStatus: function (status) {
            return this._res.status(status);
        },

        raw: function () {
            return this._res;
        },

        redirect: function (statusCode, destination) {
            return this._res.redirect.apply(this._res, _.toArray(arguments));
        },

        beenSent: function () {
            return this._res.headersSent;
        }


    });

});
