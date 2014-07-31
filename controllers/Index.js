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
        auctionKey: 'handbid-demo-auction',
        appId:     '289898497844744',
        appSecret: 'f8e41e8d38c30acf3ea059fe41dbcb20',

        /**
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            this.hb = new handbid();
            this.hb.connect();

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

            passport.serializeUser(function(user, done) {
                done(null, user);
            });

            passport.deserializeUser(function(obj, done) {
                done(null, obj);
            });

            passport.use(new facebook.Strategy({
                clientID: this.appId,
                clientSecret: this.appSecret,
                callbackURL: 'http://localhost:8082/auth/facebook/callback'
            }, function(accessToken, refreshToken, profile, done) {

                this.hb.signup({
                    facebookId: profile.id
                }, function(err, user) {
                    done(null, user);
                });

            }.bind(this)));

            return this.inherited(arguments);

        },

        /**
         * @param {altair.events.Event} e
         * @returns {altair.Promise}
         */
        index: function (e) {

            //an event has lots of useful data pertaining to a particular request.
            var response = e.get('response'),
                request = e.get('request'),
                theme = e.get('theme'),
                cookie;

            if(!request.get('back')) {
                return e.get('view').setPath(this.resolvePath('views/index/no-back.ejs')).render();
            }

            cookie = new Cookies( request.raw(), response.raw() );
            cookie.set("back", request.get('back'));

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
                            options: {
                                label: "First Name"
                            }
                        },
                        "lastName":  {
                            type:    "string",
                            options: {
                                label: "Last Name"
                            }
                        },
                        "email":     {
                            type:    "string",
                            options: {
                                label: "Email"
                            }
                        },
                        "password":  {
                            type:    "string",
                            options: {
                                label: "Password"
                            },
                            form:    {
                                template: "handbid:*/views/partials/forms/properties/password.ejs"
                            }
                        },
                        "cellPhone": {
                            type:    "string",
                            options: {
                                label: "Cell Phone"
                            }
                        },
                        "phoneType": {
                            "type":    "select",
                            "options": {
                                "label":   "Type of phone:",
                                "choices": {
                                    "iphone":  "iPhone",
                                    "android": "Android",
                                    "other":   "Other"
                                }
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
                            options: {
                                label: "Email"
                            }
                        },
                        "password": {
                            type:    "string",
                            options: {
                                label: "Password"
                            },
                            form:    {
                                template: "handbid:*/views/partials/forms/properties/password.ejs"
                            }
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
                value: user.cellPhone,
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

            this.hb.login(user.email, user.password, function (error, user) {

                this.onDidAuthenticate(error, e, user);

                dfd.resolve();
            }.bind(this));

            return dfd;

        },

        onDidAuthenticate: function (error, e, user) {

            var theme = e.get('theme'),
                response = e.get('response'),
                request  = e.get('request');

            if (error) {
                theme.set('errors', [error]);
            }
            else if (!user) {
                theme.set('errors', ['Login Failed']);
            }
            else {
                var back = request.get('back');
                this.redirectToSource(request.raw(), response.raw(), user);
                theme.set('messages', ['Success']);
            }
        },
        onWillConfigureExpressRoutes : function(e) {
            var app = e.get('express');

            app.use(expressSession({ secret: 'handbid connect' }));
            app.use(passport.initialize());
            app.use(passport.session());

            app.get('/auth/facebook',
                passport.authenticate('facebook'),
                function(req, res){
                    // The request will be redirected to Facebook for authentication, so this
                    // function will not be called.
                });

            app.get('/auth/facebook/callback',
                passport.authenticate('facebook', {
                    failureRedirect: '/' }),
                function(req, res) {
                    this.redirectToSource(req, res, req.user);
                }.bind(this));
        },
        redirectToSource: function(request, response, user) {

            var cookie = new Cookies(request, response),
                url = cookie.get("back");


            console.log(user);
        }
    });

});