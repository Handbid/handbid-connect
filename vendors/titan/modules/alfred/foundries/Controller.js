define(['altair/facades/declare',
        'altair/plugins/node!path',
        'altair/mixins/_DeferredMixin',
        'lodash'
], function (declare,
             pathUtil,
             _DeferredMixin,
             _) {

    "use strict";

    return declare([_DeferredMixin], {

        _controllers: null, //cache of controllers to keep from double generating
        _namespaces:  null, //all the namespaces we have forged

        constructor: function () {
            this._controllers = {};
            this._namespaces  = {};
        },

        nameForRoute: function (vendor, route) {

            var callbackParts   = route.action.split('::'),
                controllerName  = vendor + ':*/' + callbackParts[0];

            return controllerName;
        },

        hasController: function (named) {
            return _.has(this._controllers, named);
        },

        controller: function (named) {
            return this._controllers[named];
        },

        hasNamespace: function (named) {
            return _.has(this._namespaces, named);
        },

        controllersInNamespace: function (named) {
            return this._namespaces[named];
        },

        forgeForRoute: function (path, vendor, route, options) {

            var callbackParts   = route.action.split('::'),
                controller      = pathUtil.join(path, callbackParts[0]),
                controllerName  = this.nameForRoute(vendor, route),
                namespace       = controllerName.split('/').shift(),
                dfd;

            //track all the namespaces (1 per site)
            if (!this._namespaces[namespace]) {
                this._namespaces[namespace] = [];
            }


            if (_.has(this._controllers, controllerName)) {

                dfd = this.when(this._controllers[controllerName]);

            } else {

                dfd =  this.forge(controller, options, { type: 'controller', startup: false, parent: null, name: controllerName, foundry: this.hitch(function (Class, options, config) {

                    //override paths for things to be off the sitePath (vs relative to the controller)
                    Class.extendOnce({
                        sitePath:       path,
                        dir:            path
                    });

                    var controller = config.defaultFoundry(Class, options, config);

                    this._controllers[controllerName] = controller;
                    this._namespaces[namespace].push(controller);

                    return controller;


                })});

                this._controllers[controllerName] = dfd;

            }

            return dfd;

        }


    });

});
