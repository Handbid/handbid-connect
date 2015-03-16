define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter',
    'altair/plugins/node!handbid',
    'altair/plugins/node!passport',
    'altair/plugins/node!passport-facebook',
    'altair/plugins/node!express-session',
    'altair/plugins/node!cookies'
], function (declare, Lifecycle, Emitter, handbid, passport, facebook, expressSession, Cookies) {

    return declare([Lifecycle, Emitter], {

        hb:         null,

        /**
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            this.connectToHandbid(options);

            this.on('liquidfire:Forms::did-submit-form', {
                'form.id': 'signup'
            }).then(this.hitch('onDidSubmitSignupForm'));

            this.on('liquidfire:Forms::did-submit-form', {
                'form.id': 'login'
            }).then(this.hitch('onDidSubmitLoginForm'));

            this.on('titan:Alfred::did-receive-request', {
                'controller': this
            }).then(this.hitch('onDidReceiveRequest'));

            this.on('titan:Alfred::will-configure-express-routes').then(this.hitch('onWillConfigureExpressRoutes'));

            //where to redirect user after they remotely auth
            var redirect    = options.app.sslPort ? 'https://' : 'http://',
                port        = options.app.sslPort || options.app.port;

            redirect        = redirect + options.app.domain + ':' + port + '/auth/facebook/callback';

            //setup passport
            passport.use(new facebook.Strategy({
                clientID:       options.app.facebook.appId,
                clientSecret:   options.app.facebook.appSecret,
                callbackURL:     redirect
            }, function(accessToken, refreshToken, profile, done) {

                this.hb.signup({
                    facebookId: profile.id
                }, function(err, user) {
                    done(err, user);
                });

            }.bind(this)));

            return this.inherited(arguments);

        },

        connectToHandbid: function (options) {

            //setup handbid connect
            if(!this.hb) {

                this.hb = new handbid();
                this.hb.on('error', function (e) {

                    this.log('handbid.js error');
                    this.log(e.get('error'));

                    if(!this.hb.isConnected()) {
                        this.log('trying to connect again in 5 seconds');
                        setTimeout(this.hitch('connectToHandbid', options), 5000);
                    }

                }.bind(this));

                this.hb.on('did-connect-to-server', function (e) {
                    this.log('connected to firebird');
                }.bind(this));

                this.hb.on('disconnect', function () {

                    if(!this.hb.isConnected()) {
                        this.log('trying to connect again in 5 seconds');
                        setTimeout(this.hitch('connectToHandbid', options), 5000);
                    }

                }.bind(this));

            }

            this.log('connecting to firebird @ ' + options.app.firebird);
            this.hb.connect({ url: options.app.firebird, 'force new connection': true });

        },


        onWillConfigureExpressRoutes : function(e) {

            var app = e.get('express');

            app.use(expressSession({ secret: 'handbid-connect', resave: false, saveUninitialized: false }));
            app.use(passport.initialize());
            app.use(passport.session());

            app.get('/auth/facebook',
                passport.authenticate('facebook'),
                function(req, res){
                    // The request will be redirected to Facebook for authentication, so this
                    // function will not be called.
                });


        },

        /**
         * @param {altair.events.Event} e
         * @returns {altair.Promise}
         */
        index: function (e) {

            //an event has lots of useful data pertaining to a particular request.
            var response    = e.get('response'),
                request     = e.get('request'),
                pass,
                fail,
                theme       = e.get('theme'),
                cookie;

            cookie  = new Cookies( request.raw(), response.raw() );
            pass    = request.get('pass') || cookie.get('pass');
            fail    = request.get('fail') || cookie.get('fail');


            if(!pass || !fail) {
                return e.get('view').setPath(this.resolvePath('views/index/no-back.ejs')).render();
            }

            cookie.set("pass", pass);
            cookie.set("fail", fail);

            //was an error passed through the query string?
            if (request.get('error')) {
                e.get('theme').set('errors', [request.get('error')]);
            }

            return this.all({
                signupForm: this.createSignupForm(e),
                loginForm:  this.createLoginForm(e)
            }).then(function (forms) {

                return this.all({
                    signupForm: forms.signupForm.render('handbid:*/views/partials/forms/signup.ejs'),
                    loginForm:  forms.loginForm.render('handbid:*/views/partials/forms/login.ejs')
                });

            }.bind(this)).then(function (forms) {

                return e.get('view').render(forms);

            });


        },

        onDidReceiveRequest: function (e) {

            var theme = e.get('theme');

            theme.set('errors', false);
            theme.set('messages', false);
            theme.set('connectedToFireBird', this.hb.isConnected());

            if(!this.hb.isConnected()) {
                theme.set('bodyClass', theme.get('bodyClass') + ' site-down');
            }

        },

        createSignupForm: function (e) {

            var request = e.get('request'),
                values = request.post();

            return this.widget('liquidFire:Forms/widgets/Form.signup', {
                formValues: values,
                formSchema: {
                    properties: {
                        "firstName": {
                            type:    "string",
                            attribs: {
                                placeholder: "First Name"
                            },
                            options: {}
                        },
                        "lastName":  {
                            type:    "string",
                            attribs: {
                                placeholder: "Last Name"
                            },
                            options: {}
                        },
                        "email":     {
                            type:    "string",
                            attribs: {
                                placeholder: "Email",
                                autocomplete: "off"
                            },
                            options: {}
                        },
                        "password":  {
                            type:    "string",
                            attribs: {
                                placeholder: "Password"
                            },
                            form:    {
                                template: "handbid:*/views/partials/forms/properties/password.ejs"
                            },
                            options: {}
                        },
                        "password2":  {
                            type:    "string",
                            attribs: {
                                placeholder: "Confirm Password"
                            },
                            form:    {
                                template: "handbid:*/views/partials/forms/properties/password.ejs"
                            },
                            options: {}
                        },
                        "cellPhone": {
                            type:    "string",
                            attribs: {
                                placeholder: "Cell Phone"
                            },
                            options: {}
                        },
                        "phoneType": {
                            "type":    "select",
                            "options": {
                                "choices": {
                                    "iphone":  "iPhone",
                                    "android": "Android",
                                    "other":   "Other"
                                }
                            }
                        },
                        "agreeToTerms": {
                            "type":    "boolean",
                            form:    {
                                template: "handbid:*/views/partials/forms/properties/terms.ejs"
                            },
                            "options" : {
                                "label" : "Agree to Terms & Services"
                            }
                        }
                    }
                },
                enctype:    'multipart/form-data'
            });
        },

        createLoginForm: function (e) {

            var request = e.get('request'),
                values = request.post();

            return this.widget('liquidFire:Forms/widgets/Form.login', {
                formValues: values,
                formSchema: {
                    properties: {
                        "email":    {
                            type:    "string",
                            attribs: {
                                placeholder: 'Email / PIN'
                            },
                            options: {
                            }
                        },
                        "password": {
                            type:    "string",
                            attribs: {
                                placeholder: "Password / Phone Number ( Digits Only )"
                            },
                            options: {}
                        }
                    }
                },
                enctype:    'multipart/form-data'
            });
        },

        onDidSubmitSignupForm: function (e) {

            var dfd = new this.Deferred(),
                form = e.get('form'),
                user = form.getValues(),
                theme = e.get('theme');

            user.cellPhone = {
                value: user.cellPhone.trim(),
                type:  user.phoneType
            };

            this.hb.signup(user, function (error, user) {

                this.onDidAuthenticate(error, e, user);
                dfd.resolve();

            }.bind(this));

            return dfd;
        },

        onDidSubmitLoginForm: function (e) {

            var dfd = new this.Deferred(),
                form = e.get('form'),
                user = form.getValues(),
                theme = e.get('theme');

            this.hb.login(user.email.trim(), user.password.trim(), function (error, user) {

                this.onDidAuthenticate(error, e, user);
                dfd.resolve();

            }.bind(this));

            return dfd;

        },

        onDidAuthenticate: function (error, e, user) {

            var theme       = e.get('theme'),
                response    = e.get('response'),
                request     = e.get('request');

            if (error) {
                theme.set('errors', [error]);
            }
            else if (!user) {
                theme.set('errors', ['Login Failed']);
            }
            else {

                var back = request.get('back'),
                    auctionKey = request.get('auction');

                //we are adding this user to the auction
                if (auctionKey) {

                    this.hb.connectToAuction(auctionKey, function (err, auction) {

                        if(auction) {

                            auction.join(user._id, function (err) {

                                if(err) {
                                    this.log('error joining auction');
                                    this.log(err);
                                }

                            }.bind(this));
                        } else {

                            this.log('error loading auction by key ' + auctionKey);
                            this.log(err);
                        }

                    }.bind(this));


                }

                e.preventDefault();
                this.redirectToSource(request.raw(), response.raw(), user);

            }

        },


        redirectToSource: function(request, response, user) {

            var cookie  = new Cookies(request, response),
                url     = cookie.get("pass"),
                parts,
                hash;

            //make sure we go ahead of any #
            if(url) {
                parts = url.split('#');
                url = parts[0];
                hash = parts[1] || false;
            }

            if(!url) {
                url = '/?error=You must have cookies enabled to connect with Handbid.';
            } else if (url.indexOf("?") > -1) {
                url += "&handbid-auth=" + user.auth;
            }
            else
            {
                url += "?handbid-auth=" + user.auth;
            }

            if (hash) {
               url += '#' + hash;
            }

            response.redirect(url);

        },

        /**
         * Redirect user to "fail" url
         *
         * @param e
         */
        fail: function (e) {

            var cookie = new Cookies(e.get('request').raw(), e.get('response').raw());
            e.get('response').redirect(cookie.get('fail'));

        },

        facebookCallback: function (e) {

            var request     = e.get('request'),
                response    = e.get('response'),
                theme       = e.get('theme'),
                dfd         = new this.Deferred();

            passport.authenticate('facebook', function (err, user, info) {

                if(err) {
                    response.redirect('/?error=' + err.message);
                } else {
                    this.redirectToSource(request.raw(), response.raw(), user);
                }

                dfd.resolve();

            }.bind(this))(request.raw(), response.raw());

            return dfd;

        }
    });

});