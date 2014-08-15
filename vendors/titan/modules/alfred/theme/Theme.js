define(['altair/facades/declare',
        './head/Script',
        './head/Link',
        'lodash',
        'altair/facades/when',
        'altair/facades/all',
        'altair/facades/hitch',
        'altair/facades/mixin',
        'altair/Deferred'
], function (declare,
            HeadScript,
            HeadLink,
            _,
            when,
            all,
            hitch,
            mixin,
            Deferred) {

    "use strict";

    return declare(null, {

        _layout:    null,
        _basePath:  null,
        _headScript:null,
        _headLink:  null,
        _body:      null,
        context:    null,

        _renderer:      null,
        _renderLayout:  true,

        constructor: function (basePath, layout, renderer, options) {

            this.context        = _.cloneDeep((options && options.layoutContext) ? options.layoutContext : {});
            this._basePath      = basePath || '';
            this._layout        = layout || 'views/layout';
            this._headLink      = (options && options.headLink) || new HeadLink(basePath, renderer);
            this._headScript    = (options && options.headScript) || new HeadScript(basePath, renderer);
            this._renderer      = renderer;

            var heads = [this._headScript, this._headLink];

            //drop in media to heads
            _.each(options.media || [], function (files, ext) {

                _.each(heads, function (head) {

                    if(head.handles(ext)) {

                        _.each(files, function (file) {

                            head.append(file);


                        });

                    }

                });

            });

        },

        setBody: function (body) {
            this._body = body;
            return this;
        },

        disableLayout: function () {
            this._renderLayout = false;
            return this;
        },

        enableLayout: function () {
            this._renderLayout = true;
            return this;
        },

        headLink: function () {
            return this._headLink;
        },

        headScript: function () {
            return this._headScript;
        },

        set: function (name, value) {
            this.context[name] = value;
            return this;
        },

        get: function (name, defaultValue) {
            return this.context[name] || defaultValue;
        },

        render: function () {

            var d,
                context;

            if(this._renderLayout) {

                context = {
                    'css':  this._headLink.render(),
                    'js':   this._headScript.render(),
                    'body': when(this._body)
                };

                d = all(context).then(hitch(this, function (context) {
                    context = mixin(this.context, context);
                    return this._renderer.render(this._basePath + this._layout, context);
                }));

            } else {

                d = when(this._body);

            }

            return d;


        }


    });

});