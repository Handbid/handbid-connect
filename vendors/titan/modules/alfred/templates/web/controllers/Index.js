define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/events/Emitter'
], function (declare, Lifecycle, Emitter) {

    return declare([Lifecycle, Emitter], {

        /**
         * Just like any other AMD module in Altair, since we mixin the Lifecycle object, we can be certain that our
         * startup(options) method will be invoked (on all controllers) before anything else.
         *
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            //all events pertaining to a request are passed through titan:Alfred. See titan:Alfred/package.json for
            //a description of all events available.
            this.on('titan:Alfred::did-receive-request', {
                'controller': this
            }).then(this.hitch('onDidReceiveRequest'));

            //pass call to parent
            return this.inherited(arguments);

        },

        /**
         * This is invoked whenever the did-receive-request event is emitted from Alfred. Alfred uses the concept of a
         * "theme" to represent the layout (views are dropped into layouts) of the current page. You can pass variables
         * through the theme to make them available in the layout. A theme is also responsible for handling all js/css
         * that will be included. See titan:Alfred/theme/Theme for more details.
         *
         * @param {altair.events.Event} e
         */
        onDidReceiveRequest: function (e) {

            //i'm getting the theme for the request
            var theme = e.get('theme');

            theme.set('errors', false)
                 .set('messages', false);

            e.set('foo', 'bar'); //setting anything to an event will make that data available for the entire request

            //drop in arbitrary js
//            theme.headScript().append('/public/js/test.js');

        },

        /**
         * We've configured out ./configs/alfred.json to direct any request for '/' to index. From here, I'm doing a lazy
         * check if someone has POSTed a username and password and if they match, I'm redirecting them to /admin/dashboard.
         *
         * @param {altair.events.Event} e
         * @returns {altair.Promise}
         */
        index: function (e) {

            //an event has lots of useful data pertaining to a particular request.
            var response    = e.get('response'),
                request     = e.get('request'),
                theme       = e.get('theme'),
                body        = request.post();

            console.log(e.get('foo') === 'bar'); //prints `true` because we set it in didReceiveRequest(e);

            //my request/response objects are simple wrappers to the request/response provided by the current
            //web server strategy (most likely express3 as of the time of this writing).
            if (request.method() === 'POST') {

                if (body.username === 'admin' && body.password === 'taco') {

                    response.redirect('/admin/dashboard');

                } else {
                    theme.set('errors', [
                        "Login failed, Please try again"
                    ]);
                }

            }

            //by default, the current view is ./views/index.ejs - it will be set into the theme's context as `body`
            return e.get('view').render();
        }

    });

});