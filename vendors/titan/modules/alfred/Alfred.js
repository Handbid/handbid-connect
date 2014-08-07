/**
 * Bringing a simple MVC environment for building web apps in Altair
 *
 * @author:     Jon Hemstreet, Taylor Romero
 * @license:    MIT
 * @copyright:  Taylor Romero, Inc 2014
 * @vendor:     titan
 * @module:     Alfred
 * @nexus:      this.nexus("titan:Alfred")
 *
 */
define(['altair/facades/declare',
        'lodash',
        'apollo/_HasSchemaMixin',
        'altair/modules/commandcentral/mixins/_HasCommandersMixin',
        './mixins/_HasServerStrategiesMixin',
        './nexusresolvers/Controllers',
        'require',
        './extensions/Model',
        'altair/mixins/_AssertMixin'
], function (declare,
             _,
             _HasSchemaMixin,
             _HasCommandersMixin,
             _HasServerStrategiesMixin,
             ControllersResolver,
             require,
             ModelExtension,
             _AssertMixin) {

    return declare([_HasSchemaMixin, _HasCommandersMixin, _HasServerStrategiesMixin, _AssertMixin], {

        //all the strategies we have registered, key is name, value is nexus id
        _strategies:    null,
        _activeServers: null,
        _controllerFoundry: null,

        //during startup, lets add some extensions to make all the MVC functionality work beautifully
        startup: function (options) {

            var _options            = options || this.options || {},
                cartridge           = _options.extensionCartridge || this.nexus('cartridges/Extension'),
                model               = _options.modelExtension || new ModelExtension(cartridge);

            this._activeServers = [];

            //drop in new extensions
            this.deferred = cartridge.addExtension(model).then(this.hitch(function () {

                return this;

            })).then(this.hitch(function () {

                //create our controller foundry
                return this.forge('./foundries/Controller');

            })).then(this.hitch(function (foundry) {

                var resolver = new ControllersResolver(foundry);

                this._nexus.addResolver(resolver);

                this._controllerFoundry = foundry;

                return this;

            }));

            return this.inherited(arguments);

        },

        execute: function (options) {

            var _options = options || this.options || {};

            if (_options.site) {

                this.assert(!!_options.site.options, 'You must pass your site options. See README.md for more details.');

                if (!_options.site.options.dir) {
                    _options.site.options.dir = '.';
                }

                _options.site.options.dir = this.nexus('Altair').resolvePath(_options.site.options.dir);

                this.deferred = this.refreshStrategies().then(function () {
                    return this.startupServer(_options.site.strategy, _options.site.options);
                }.bind(this));

            }

            return this.inherited(arguments);

        },

        /**
         * Startup a server by name
         *
         * @param strategy the name of the server strategy to use
         * @param _options options passed to the strategy.
         * @returns {altair.Deferred}
         */
        startupServer: function (strategy, options) {

            var app = options || {},
                _router,
                server;

            this.assert(!!this._strategies, 'You must call refreshStrategies before starting up a titan:Alfred web server.');
            this.assert(!!this._strategies[strategy], 'You must pass a valid web server strategy to titan:Alfred');

            //pass controller foundry to the router
            app.controllerFoundry = this._controllerFoundry;

            //create a router
            return this.forge(app.router || 'routers/Config', app).then(function (router) {

                _router = router;

                //generate populated routes (see strategies/README.md)
                return router.generateAppConfig();

            }).then(this.hitch(function (_app) {

                var _paths = {};

                //pass the newly generated routes our server strategy
                app         = _app;
                app.router  = _router;

                //map the vendor
                if (!app.vendor) {
                    throw new Error('You must set a vendor in your site config.');
                }

                //include paths
                _paths[app.vendor] = app.path;

                require({
                    paths: _paths
                });

                //if they passed a string, assume a foundry compatible class name
                if (_.isString(strategy)) {

                    //pass to the foundry for startup
                    return this.forge(this._strategies[strategy], app);

                }
                //if a strategy was passed
                else {

                    //just start it up
                    return strategy.startup(app);

                }

            })).then(this.hitch(function (server) {

                return this.emit('will-execute-server', {
                    server: server,
                    app:    app,
                    router: _router
                });

            })).then(this.hitch(function (e) {

                server = e.get('server');

                //execute the server
                server.execute();

                //add it to list of active servers
                this._activeServers.push(server);

                //let the world know we have executed
                return this.emit('did-execute-server', {
                    server: server,
                    app:    app,
                    router: _router
                });

            })).then(function (e) {
                return e.get('server');
            });



        },

        /**
         * Currently available strategies, key is name, value is nexus id.
         *
         * @returns {*}
         */
        strategies: function () {
            return this._strategies;
        },

        /**
         * All the web server strategies we have available
         *
         * @returns {altair.Deferred}
         */
        refreshStrategies: function () {

            return this.emit('register-server-strategies').then(this.hitch(function (e) {

                var _strategies = {};

                _.each(e.results(), function (obj) {
                    _.merge(_strategies, obj);
                });

                this._strategies = _strategies;

                return _strategies;

            }));

        },

        /**
         * All the servers we have running.
         *
         * @returns {[]}
         */
        activeServers: function () {
            return this._activeServers || [];
        },

        /**
         * Tears down all active servers;
         *
         * @returns {*}
         */
        teardown: function () {

            return this.all(_.map(this._activeServers, function (server) {

                return server.teardown();

            }, this)).then(function () {

                return this;

            }.bind(this));

        }

    });
});