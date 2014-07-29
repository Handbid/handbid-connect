define(['altair/facades/declare',
    'altair/plugins/node!fs',
    'altair/plugins/node!mkdirp',
    'lodash',
    'altair/Lifecycle',
    'altair/facades/glob',
    'altair/facades/mixin'
], function (declare, fs, mkdirp, _, Lifecycle, glob, mixin) {

    return declare([Lifecycle], {

        //cache controllers by name
        _controllerFoundry: null,
        _dir:               '',

        startup: function (options) {

            var _options = options || this.options || {};

            this._dir = _options.dir;

            //make sure path ends with a /

            if (!this._dir) {

                this.deferred = new this.Deferred();
                this.deferred.reject(new Error('You must pass routers/AppConfig a dir (which is the root of the website you want to launch)'));

            } else {

                if (this._dir.slice(-1) !== '/') {
                    this._dir = this._dir + '/';
                }

                //if there is no controller foundry, lets create one
                if (!_options.controllerFoundry) {

                    this.deferred = this.forge('../foundries/Controller').then(this.hitch(function (foundry) {
                        this._controllerFoundry = foundry;
                        return this;
                    }));

                } else {
                    this._controllerFoundry = _options.controllerFoundry;
                }


            }


            return this.inherited(arguments);

        },

        /**
         * Looks in the path for an package.json, then loads the files and sets up callbacks for the routes
         *
         * @param options override any local prop
         * @param controllerOptions any options you want passed to your controller for startup
         * @returns {altair.Deferred} will resolve with the populated and configured routes
         */
        generateAppConfig: function (controllerOptions) {

            this.assertFail('generateAppConfig must be overridden by sublcass');

        },

        /**
         * If there are adapters specified in the app.json, lets create them
         *
         * @param adapters
         */
        createDatabaseAdapters: function (adapters) {

            var d, list, db = this.nexus('cartridges/Database');

            if (!adapters || !db) {

                d = new this.Deferred();
                d.resolve([]);

            } else {

                list = [];

                _.each(adapters, function (adapter) {

                    list.push(this.promise(require, [adapter.path]).then(this.hitch(function (Adapter) {

                        var _adapter = new Adapter(db, adapter.options);
                        return db.addAdapter(_adapter);

                    })));

                }, this);

                d = this.all(list);

            }

            return d;

        },

        /**
         * Attaches controllers to the routes
         *
         * @param routes
         * @param options
         * @returns {*|Promise}
         */
        attachControllers: function (vendor, routes, options) {

            var list = [];

            //setup routes with real callbacks
            _.each(routes, function (route, key) {

                //attach the controller to the route.. if an error occurs, log it and delete the route
                var d = new this.Deferred();
                list.push(d);

                //attach the controller
                this.attachControllerToRoute(vendor, route, options).then(function (route) {

                    d.resolve(routes);

                }).otherwise(this.hitch(function (err) {

                        //if it fails, log it, but keep going
                        this.log(err);
                        d.reject(routes);

                    }));

            }, this);

            return this.all(list).then(function () {
                return routes;
            });

        },

        /**
         * Attach the required controller to a particular route.
         *
         * @param vendor
         * @param route
         * @param options
         * @returns {Deferred}
         */
        attachControllerToRoute: function (vendor, route, options) {

            if (!route.action) {
                throw new Error('Each route in your app.json needs an "action" that is the callback to invoked. Example: controllers/Admin::index');
            }

            var foundry = this._controllerFoundry,
                path = this._dir,
                deferred = new this.Deferred(),
                action = route.action.split('::').pop(),//action comes in form controller/Name::action
                attach = this.hitch(function (controller) {

                    if (!controller[action]) {
                        deferred.reject(new Error(controller + ' is missing callback ' + action + '(e) for route "' + route.url + '"'));
                    } else {
                        this.log('attaching route ' + route.url + ' to callback ' + route.action);
                        route.callback = this.hitch(controller, action);
                        route.controller = controller;
                        route.action = action;
                        deferred.resolve(route);
                    }

                });


            foundry.forgeForRoute(path, vendor, route, options).then(function (controller) {

                attach(controller);

            }).otherwise(this.hitch(function (err) {

                this.log(err);

            }));


            return deferred;


        },

        /**
         * This will startup every controller, passing them the appConfig during startup.
         *
         * @param routes
         */
        startupControllers: function (appConfig) {


            var beenStarted = {},
                l = _.map(appConfig.routes, function (route) {

                    var controller = route.controller;

                    if (!beenStarted[controller.name] && controller.startup) {
                        beenStarted[controller.name] = true;
                        return controller.startup({ route: route, app: appConfig });
                    } else {
                        return controller;
                    }

                });


            return this.all(l);

        },

        /**
         * Properties in Altair can have a media property to specify css/jss/less etc. they need to be included in order to be rendered
         *
         * @param path
         * @param routes
         */
        attachMediaForPropertyTypes: function (media) {


            var apollo = this.nexus('cartridges/Apollo'),
                types = apollo.propertyTypes();


            _.each(types, function (type) {

                if (type.media) {

                    _.merge(media, type.media, function (a, b) {
                        return _.isArray(a) ? a.concat(b) : undefined;
                    });

                }

            }, this);


            return this.all(media);

        },

        /**
         * Looks in a path and attaches the js/css to each route
         *
         * @param path
         * @param routes the routes pulled from app.json
         * @param append should be added to the end of the current media?
         *
         * @returns {altair.Deferred}
         */
        attachMedia: function (routes, globalMedia, append) {

            var l = [],
                resolving = {};

            _.each(routes, function (route) {

                //initialize media
                if (!route.media) {
                    route.media = {};
                }

                //if there is a global media, drop it into the route and ignore the types it has
                if (globalMedia) {

                    var media = {};

                    _.merge(media, globalMedia, route.media, function (a, b) {
                        return _.isArray(a) ? a.concat(b) : undefined;
                    });

                    //add global media to beginning or end?
                    if (append) {

                        route.media = mixin(media, route.media);

                    } else {

                        route.media = mixin(route.media, media);
                    }

                }

                //loop through all media and resolve any nexus id's we find
                _.each(route.media, function (files, type) {

                    _.each(files, function (file, i) {

                        //is it a nexus id?
                        if (file.search(':') > 0 && file.search('http') === -1) {

                            if (_.has(resolving, file)) {

                                files[i] = resolving[file];

                            } else {

                                files[i] = resolving[file] = this.importMedia(file);

                            }

                        }

                    }, this);

                    l.push(this.all(files).then(function (files) {
                        route.media[type] = files;
                    }));

                }, this);


            }, this);


            return this.all(l).then(function () {
                return routes;
            });

        },

        /**
         * Copy any media (css, js, less) that does not exist in web safe dir. Must be a path that has a .../public/css/..
         * or .../public/js/.. or .../public/less/...
         *
         * @param from a path to file.
         */
        importMedia: function (from) {

            var to = this._dir,
                qParts = from.split('?'), //incase we have a query string
                _from = this.resolvePath(qParts.shift()),
                parts = _from.split('public'),
                url = pathUtil.join('/public/_copied/', parts.pop()),
                dest = pathUtil.join(to, url),
                destDir = pathUtil.dirname(dest);

            return this.promise(mkdirp, destDir).then(function () {

                fs.createReadStream(_from).pipe(fs.createWriteStream(dest));

                return (qParts.length > 0) ? url + '?' + qParts.join('?') : url;

            });


        },


        /**
         * Attach layouts to the routes
         *
         * @param path the folder we are using as the site root
         * @param routes the routes from app.json
         * @returns {*}
         */
        attachLayout: function (routes) {

            //loop through each rout and glob for candidates
            var list = [],
                path = this._dir;

            _.each(routes, function (route) {

                var name = route.layout || route.controller.name.split('/').pop().toLowerCase(),
                    d = new this.Deferred(),
                    candidates = [
                        path + 'views/layout.*',
                        path + 'views/layouts/' + name + '.*'
                    ];

                list.push(glob(candidates).then(this.hitch(function (matches) {

                    //attach layout
                    if (matches.length > 0) {
                        route.layout = matches.pop().replace(path, '');
                    }

                    d.resolve();

                })));


            }, this);

            return this.all(list).then(function () {
                return routes;
            });

        },

        /**
         * Attach view script to every endpoint who has one
         *
         * @param path
         * @param routes
         */
        attachViews: function (routes) {

            //loop through each rout and glob for candidates
            var list = [],
                path = this._dir;

            _.each(routes, function (route) {

                var name = route.view || route.controller.name.split('/').pop().toLowerCase(),
                    action = route.action.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
                    d = new this.Deferred(),
                    candidates = [
                        path + 'views/' + name + '.*',
                        path + 'views/' + name + '/' + action + '.*'
                    ];

                list.push(glob(candidates).then(this.hitch(function (matches) {

                    //attach layout
                    if (matches.length > 0) {
                        route.view = matches.pop().replace(path, '');
                    }

                    d.resolve();

                })));


            }, this);

            return this.all(list).then(function () {
                return routes;
            });


        }



    });

});