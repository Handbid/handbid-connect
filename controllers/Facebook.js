define(['altair/facades/declare',
    'altair/facades/hitch',
    'altair/Lifecycle',
    'altair/events/Emitter',
    'altair/plugins/node!passport',
    'altair/plugins/node!passport-facebook'
],

    function (declare, Lifecycle, hitch, Emitter, passport, facebook) {

        return declare([Lifecycle, Emitter], {
            appId:     '289898497844744',
            appSecret: 'f8e41e8d38c30acf3ea059fe41dbcb20',


            startup:  function (options) {

                //use options passed or the ones set in the constructor
                var _options = options || this.options;

                this.on('titan:Alfred::will-configure-express-routes').then(this.hitch('onWillConfigureExpressRoutes'));

//                passport.serializeUser(function(user, done) {
//                    done(null, user);
//                });
//
//                passport.deserializeUser(function(obj, done) {
//                    done(null, obj);
//                });
//
                passport.use(new facebook.Strategy({
                    clientID: this.appId,
                    clientSecret: this.appSecret,
                    callbackURL: 'http://localhost:8082/auth/facebook/callback'
                }, function(accessToken, refreshToken, profile, done) {
                    console.log(accessToken);
//                    process.nextTick(function() {
//                        //Assuming user exists
//                        done(null, profile);
//                    });
                }));

                return this.inherited(arguments);

            },
            index:    function (e) {

//                passport.authenticate('facebook');
//
            },
            callback: function (e) {
                passport.authenticate('facebook', {
                    successRedirect: '/success',
                    failureRedirect: '/error'
                });
            },
            onWillConfigureExpressRoutes : function(e) {
                var express = e.get('express');

//                app.use(passport.session());
//                app.use(passport.initialize());
            }
        });

    });