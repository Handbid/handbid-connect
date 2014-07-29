define(['altair/facades/declare',
    'altair/plugins/node!path',
    './_Base',
    'lodash'
],
    function (declare, pathUtil, _Base, _) {

        return declare([_Base], {


            generateAppConfig: function (controllerOptions) {

                var path = this._dir,
                    json = pathUtil.join(path, 'package');

                return this.promise(require, ['altair/plugins/config!' + json]).then(this.hitch(function (config) {

                    if (!config) {
                        throw new Error('Could not find ' + json);
                    }

                    //clone the config so we never mutate it
                    var appConfig = _.cloneDeep(config, true),
                        media = appConfig.media || {};

                    appConfig.port = this.options.port;
                    appConfig.path = path;

                    this.log('loading', config.name);

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

                }));

            }



        });

    });