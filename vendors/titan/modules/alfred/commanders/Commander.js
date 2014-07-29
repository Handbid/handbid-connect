define(['altair/facades/declare',
        'altair/modules/commandcentral/mixins/_IsCommanderMixin',
        'altair/plugins/node!fs',
        'lodash'
],
    function (declare, _IsCommanderMixin, fs, _) {

        return declare([_IsCommanderMixin], {


            /**
             * Refresh server strategies so we have options for our schema
             *
             * @returns {altair.Deferred}
             */
            startup: function () {
                var _args = arguments;
                return this.parent.refreshStrategies().then(this.hitch(function () {
                    return this.inherited(_args);
                }));
            },

            /**
             * Startup a web server
             */
            start: function (options) {

                var named = options.strategy || this.parent.get('defaultStrategy');

                //refresh strategies
                return this.parent.refreshStrategies().then(this.hitch(function (strategies) {

                    //forge one, but do not start it up
                    return this.forge(strategies[named], null, { startup: false });

                })).then(this.hitch(function (server) {

                    //prompt user for schema
                    return this.form(server.schema());

                })).then(this.hitch(function (values) {

                    //start the new server and user the router that parses packages
                    values.router = 'routers/Package';
                    return this.parent.startupServer(named, values).otherwise(this.hitch('log'));

                }));


            },


            /**
             * Start a webserver that reboots every 5 seconds (I think there is an issue with express that breaks this ability)
             *
             * @param options
             */
            startRecycle: function (options) {

                var recycle = this.hitch(function () {

                    this.start(options).then(this.hitch(function (server) {

                        setTimeout(this.hitch(function () {

                            if (server) {
                                server.teardown().then(recycle).otherwise(this.hitch('log'));
                            } else {
                                recycle();
                            }

                        }), 5000);

                    }));

                });

                recycle();

            },

            /**
             * Update schema at runtime
             *
             * @param named
             */
            schemaForCommand: function (command) {

                var schema = this.inherited(arguments),
                    strategies;

                //the newModule command has some choices that need updating (destination dir)
                if (command.callback === 'start' || command.callback === 'startRecycle') {

                    strategies = this.parent.strategies();
                    schema.setOptionFor('strategy', 'choices', strategies);

                }


                return schema;
            },

            /**
             * Forge a new website
             *
             * @param values
             * @returns {Deferred}
             */
            site: function (values) {

                this.writeLine('forging new website...');

                var dfd = new this.Deferred(),
                    from = this.parent.resolvePath('templates/web'),
                    moduleConfig,
                    devModuleConfig;

                this.writeLine('forging new altair app.');

                //first forge an app
                return this.forge('altair:TheForge/models/App').then(function (app) {

                    return app.forge(values.destination).step(function (step) {
                        this.writeLine(step.message, step.type);
                    }.bind(this));

                }.bind(this)).then(function (results) {

                    this.writeLine('app forged, configuring modules.json');

                    //get the database config so we can modify it
                    moduleConfig = _.where(_.flatten(results), function (obj) {
                        return obj.file === 'modules.json';
                    })[0];

                    devModuleConfig = _.where(_.flatten(results), function (obj) {
                        return obj.file === 'modules-dev.json';
                    })[0];

                    return this.all({
                        default:    this.parseConfig(moduleConfig.to),
                        dev:        this.parseConfig(devModuleConfig.to)
                    });

                }.bind(this)).then(function (configs) {

                    var all = [];


                    if (!configs['default']['titan:Alfred']) {

                        this.writeLine('no titan:Alfred block exists, creating now.');

                        configs['default']['titan:Alfred'] = {
                            '$ref': './alfred.json'
                        };

                        all.push(this.promise(fs, 'writeFile', moduleConfig.to, JSON.stringify(configs.default, null, 4)));


                    } else {

                        this.writeLine('titan:Alfred block already exists, skipping config.');
                    }

                    if (!configs.dev['titan:Alfred']) {

                        this.writeLine('no titan:Alfred dev block exists, creating now.');

                        configs.dev['titan:Alfred'] = {
                            '$ref': './alfred-dev.json'
                        };

                        all.push(this.promise(fs, 'writeFile', devModuleConfig.to, JSON.stringify(configs.dev, null, 4)));


                    } else {

                        this.writeLine('titan:Alfred dev block already exists, skipping config.');
                    }


                    return this.all(all);


                }.bind(this)).then(function () {

                    this.writeLine('app forge and configuration complete, forging site');

                    return this.parent.forge('altair:TheForge/models/Copier');

                }.bind(this)).then(function (copier) {

                    return copier.execute(from, values.destination, values).step(function (step) {

                        this.writeLine(step.message, step.type || '');

                    }.bind(this));


                }.bind(this)).then(function (results) {

                    this.writeLine('site created at: ' + values.destination);
                    this.writeLine('run the following commands:', 'h1');
                    this.writeLine('-----------------------');
                    this.writeLine('| $cd ' + values.destination);
                    this.writeLine('| $altair');
                    this.writeLine('-----------------------');

                }.bind(this));

                return dfd;

            }

        });
    });