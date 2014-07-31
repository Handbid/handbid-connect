define(['altair/facades/declare',
    'altair/facades/hitch',
    'altair/facades/mixin',
    'altair/plugins/node!express',
    'altair/plugins/node!http',
    'altair/plugins/node!body-parser',
    'altair/plugins/node!multiparty',
    'altair/facades/when',
    '../theme/Theme',
    '../theme/View',
    '../http/Request',
    '../http/Response',
    'lodash',
    './_Base'
], function (declare, hitch, mixin, express, http, bodyParser, multiparty, when, Theme, View, Request, Response, _, _Base) {

    return declare([_Base], {

        _app:      null,
        _client:   null,
        appConfig: null,
        Theme:     Theme,
        View:      View,
        Request:   Request,
        Response:  Response,
        startup:   function (options) {

            var _options = options || this.options || {};

            //no routes, no good
            if (!_options.routes) {
                throw new Error('every web server needs routes.');
            }

            //dependency injection
            if (_options.Theme) {
                this.Theme = _options.Theme;
            }

            if (_options.View) {
                this.View = _options.View;
            }

            //create express app
            this._app = express();

            //configure express
            this.configureApp(_options);

            return this.inherited(arguments);

        },


        /**
         * Instance of express.
         * @returns {alfred.strategies._Base._app|*}
         */
        app: function () {
            return this._app;
        },

        /**
         * Configures express using the site's app.json
         *
         * @param app fully populated app.json
         * @returns {alfred.strategies._Base}
         */
        configureApp: function (app) {

            //in case someone wants to reconfigure the app (minus routes of course since those are set during startup)
            this.appConfig = app;

            this.parent.emit('will-configure-express-middle', {
                strategy:   this,
                express:    this._app
            });

            this._app.use(bodyParser.json());       // to support JSON-encoded bodies
            this._app.use(bodyParser.urlencoded({extended: true}));

            this.parent.emit('will-configure-express-routes', {
                strategy:   this,
                express:    this._app
            });


            //serve this dir statically
            this.serveStatically(app.path + 'public', '/public');

            //loop through each route
            _.each(app.routes, function (route, url) {

                var verb = 'all',
                    _url = url,
                    parts;

                if (url.search(' ') > 0) {
                    parts = url.split(' ');
                    verb = parts[0];
                    _url = parts[1];
                }

                //set the path callback
                this._app[verb](_url, this.hitch(function (req, res, next) {
                    this.handleRequest(_url, route, req, res, next);
                }));


            }, this);


            return this;

        },

        /**
         * Serve some files to the browser (images, js, etc.)
         *
         * @param path
         * @param uri
         * @returns {alfred.strategies._Base}
         */
        serveStatically: function (path, uri) {
            this._app.use(uri, express.static(path));
            return this;
        },

        /**
         * Called on every request
         *
         * @param route
         * @param _req
         * @param _res
         * @param next
         */
        handleRequest: function (url, route, _req, _res, next) {

            var _route = route,
                app = this.appConfig,
                router = app.router,
                module = this.parent,
                renderer = module.nexus('liquidfire:Onyx'),
                req = new this.Request(_req),
                res = new this.Response(_res),
                layout = _route.layout,
                theme = layout ? new this.Theme(app.path, _route.layout, renderer, _route) : undefined,
                view = _route.view && _.isString(_route.view) ? new this.View(app.path + _route.view, renderer) : _route.view,
                dfd,
                multiForm;

            //pretend that post always worked! yay!!
            if (req.method() === 'POST' && req.header('content-type') && req.header('content-type').search('multipart') === 0) {

                multiForm = new multiparty.Form();

                dfd = this.promise(multiForm, 'parse', req.raw()).then(function (results) {

                    var _values = mixin(results[0], results[1]),
                        values = {};

                    _.each(_values, function (v, k) {
                        if(k.search(/\[\]/) > 0) {
                            values[k.replace('[]', '')] = v;
                        } else {
                            values[k] = v.pop();
                        }
                    });


                    req.raw().body = values;

                });


            }

            //give us time to parts multipart forms
            this.when(dfd).then(function () {

                //emit the event, then pass it to the controller
                return module.emit('did-receive-request', {
                    url:        url,
                    request:    req,
                    response:   res,
                    theme:      theme,
                    route:      _route,
                    router:     router,
                    view:       view,
                    controller: _route.controller,
                    callback:   _route.callback,
                    routes:     app.routes
                });

            }).then(function (e) {


                if (e.active) {
                    return when(e.get('callback')(e)).then(function (response) {

                        //in case the theme has been modified
                        theme = e.get('theme');

                        return response;
                    });
                } else {
                    return e.get('body');
                }


            }).then(function (results) {

                //we may not emit this event
                var event = module.coerceEvent('will-render-theme', {
                    body:     results,
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });

                if (theme) {

                    return module.emit(event);

                } else {

                    return event;

                }


            }).then(function (e) {

                var body = e.get('body'),
                    theme;

                //if there is a theme, set its body and render it
                if (e.get('theme') && _.isString(body)) {

                    body = e.get('theme').setBody(body).render();

                } else {

                    //clear out the theme if we are responding with an object (so did-render-theme will not hit)
                    theme = null;

                }

                return when(body);


            }).then(function (results) {

                //we may not emit this event
                var event = module.coerceEvent('did-render-theme', {
                    body:     results,
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });

                if (theme) {

                    return module.emit(event);

                } else {

                    return event;

                }


            }).then(function (e) {

                return module.emit('will-send-response', {
                    body:     e.get('body'),
                    url:      url,
                    request:  req,
                    response: res,
                    theme:    theme,
                    route:    _route,
                    router:   router,
                    view:     view,
                    routes:   app.routes
                });


            }).then(function (e) {

                var body = e.get('body');

                if (!res.beenSent()) {
                    res.send(body);
                }

                return module.emit('did-send-response', {
                    body:     body,
                    path:     url,
                    request:  req,
                    response: res,
                    route:    _route,
                    router:   router,
                    routes:   app.routes
                });


            }).otherwise(this.hitch(function (err) {

                this.onError(err, res);

            }));


        },

        onError: function (err, response) {

            this.log(err);

            if (response) {
                response.setStatus(500);
                response.send(err.stack);
            }


        },

        /**
         * Starts the server.
         *
         * @returns {*}
         */
        execute: function () {

            this.deferred = new this.Deferred();

            this.log('starting alfred on port ' + this.get('port'));

            try {

                this._client = http.createServer(this._app);
                this._client.on('error', hitch(this, function (err) {
                    this.onError(err);
                    this.deferred.reject(err);
                }));

                this._client.listen(this.get('port'));

            } catch (e) {
                this.log(e);
                this.deferred.reject(e);
            }

            return this.inherited(arguments);
        },

        /**
         * The http server I am using.
         *
         * @returns {httpServer}
         */
        http: function () {
            return this._client;
        },

        /**
         * Close the server.
         *
         * @returns {*}
         */
        teardown: function () {

            this.log('tearing down server');
            return this.promise(this._client, 'close');

        }

    });

});
