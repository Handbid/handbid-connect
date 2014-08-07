define(['altair/facades/declare',
    './_Base',
     'lodash'
],
    function (declare, _Base, _) {

        return declare([_Base], {


            generateAppConfig: function (controllerOptions) {

                var path        = this._dir,
                    appConfig   = _.cloneDeep(this.options, true),
                    media       = appConfig.media || {};

                appConfig.port = this.options.port;
                appConfig.path = path;

                this.log('loading', appConfig.domain);

                _.each(appConfig.routes, function (route, url) {
                    route.url = url;
                });

                return this.createDatabaseAdapters(appConfig.database ? appConfig.database.connections : false)
                    .then(this.hitch('attachControllers', appConfig.vendor, appConfig.routes, controllerOptions))
                    .then(this.hitch('attachLayout', appConfig.routes))
                    .then(this.hitch('attachViews', appConfig.routes))
                    .then(this.hitch('attachMediaForPropertyTypes', media))
                    .then(this.hitch('attachMedia', appConfig.routes, media))
                    .then(this.hitch('startupControllers', appConfig))
                    .then(function () {

                        return appConfig;

                    });


            }



        });

    });