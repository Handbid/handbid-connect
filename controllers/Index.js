define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/events/Emitter',
    'altair/plugins/node!handbid'
], function (declare, Lifecycle, Emitter, handbid) {

    return declare([Lifecycle, Emitter], {

        hb: null,
        auctionKey : 'handbid-demo-auction',

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
                theme = e.get('theme');

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

        onDidReceiveRequest: function(e) {

            var theme = e.get('theme');

            //set links, errors, and messages to our theme
            theme.set('errors', false);

        },

        createSignupForm: function (e) {

            var request = e.get('request'),
                values = request.post();
            return this.widget('liquidFire:Forms/widgets/Form.signup', {
                formValues: values,
                formSchema: {
                    properties: {
                        "firstName":   {
                            type:    "string",
                            options: {
                                label: "First Name"
                            }
                        },
                        "lastName":    {
                            type:    "string",
                            options: {
                                label: "Last Name"
                            }
                        },
                        "email":       {
                            type:    "string",
                            options: {
                                label: "Email"
                            }
                        },
                        "cellPhone": {
                            type:    "string",
                            options: {
                                label: "Cell Phone"
                            }
                        },
                        "phoneType":   {
                            "type":    "select",
                            "options": {
                                "label":   "Please contact me by:",
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
                        "email":        {
                            type:    "string",
                            options: {
                                label: "Email"
                            }
                        },
                        "password": {
                            type:    "string",
                            options: {
                                label: "Password"
                            }
                        }
                    }
                },
                enctype:    'multipart/form-data'
            });
        },

        onDidSubmitSignupForm: function (e) {

            var dfd  = new this.Deferred(),
                form = e.get('form'),
                user = form.getValues(),
                theme = e.get('theme');

                this.hb.signup(user, function (user) {
                    dfd.resolve();
                }).otherwise(function(err) {
                    theme.set('errors', err);
                    dfd.resolve();
                });

            return dfd;
        },

        onDidSubmitLoginForm:  function (e) {
            var dfd  = new this.Deferred(),
                form = e.get('form'),
                user = form.getValues(),
                theme = e.get('theme');

            this.hb.login(user.email, user.password, function (user) {
                alert('logged in!' + user);
                dfd.resolve();
            }).otherwise(function(err) {
                theme.set('errors', err);
                dfd.resolve();
            });

            return dfd;

        }
    });

});