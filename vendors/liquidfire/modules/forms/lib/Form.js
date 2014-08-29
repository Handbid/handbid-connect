define(['altair/facades/declare',
    'altair/mixins/_DeferredMixin',
    'apollo/_HasSchemaMixin',
    'lodash',
    'altair/plugins/node!escape-html'
], function (declare, _DeferredMixin, _HasSchemaMixin, _, escape) {

    return declare([_DeferredMixin, _HasSchemaMixin], {

        _templateResolver: null,
        method:            'GET',
        enctype:           'application/x-www-form-urlencoded',
        action:            '',
        autoHandleSubmit:  true,
        id:                '',
        _cloneableProps:   ['id', 'method', 'enctype', 'action', 'autoHandleSubmit'], //when cloning a form, these props will be set on the new instance

        constructor: function (options) {

            var _options = options || {};

            this.id                 = _options.id;
            this._schema            = _options.schema;
            this.method             = _options.method || this.method;
            this.enctype            = _options.enctype || this.enctype;
            this.action             = _options.action || this.action;

            //additional options
            this.autoHandleSubmit   = _.has(_options, 'autoHandleSubmit') ? _options.autoHandleSubmit : this.autoHandleSubmit;

            if (!this.id) {
                throw new Error('Forms need an id; new Form({ id: \'my-form\', schema: ... })');
            }

            if (!this._schema) {
                throw new Error('Forms need a schema; new Form({ id: \'my-form\', schema: ... })');
            }

        },

        /**
         * Gets you all the properties on this form that are OK to render.
         *
         * @returns {{}}
         */
        renderableProperties: function () {

            var cleanedProps = {},
                props = _.map(this.schema().properties(), function (property, named) {

                    var prop = _.cloneDeep(property);

                    return prop;

                });

            //remove any property whose include is false
            props = _.remove(props, function (property) {

                if (!property.form || !_.has(property.form, 'include')) {
                    return true;
                }

                return property.form.include;

            });

            _.each(props, function (prop) {
                cleanedProps[prop.name] = prop;
            });

            return cleanedProps;

        },

        /**
         * Has this particular element been set as hidden
         *
         * @param name
         * @return {boolean}
         */
        isHidden: function (name) {
            var prop = this.schema().property(name);
            return prop.form && prop.form.hidden;
        },

        /**
         * Gets you templates looking in the paths you specify for all render-able properties
         *
         * @param paths
         */
        templates: function (paths, fallbackPath) {

            var d, data, schema;

            if (!paths) {

                d = new this.Deferred();
                d.reject(new Error('You must pass the paths to Form.templates() so I know where to look for views.'));

                return d;

            }

            data = _.cloneDeep(this.schema().data());

            //replace properties with renderable ones
            data.properties = this.renderableProperties();

            //create a schema with renderable props
            schema = this.nexus('cartridges/Apollo').createSchema(data);

            //de we already have a template resolver?
            if (this._templateResolver) {

                d = this._templateResolver.templatesFromSchema(schema, paths, fallbackPath);

            }
            //lazy load it if not
            else {

                d = this.parent.forge('templates/Resolver').then(function (resolver) {

                    this._templateResolver = resolver;
                    return resolver.templatesFromSchema(schema, paths, fallbackPath);

                });
            }

            return d;

        },

        /**
         * Render the html attributes for a property
         *
         * @param property
         * @returns {altair.Deferred}
         */
        renderPropertyAttributes: function (property) {

            var attribs = property.attribs || {},
                markup = '';

            if (property.options.required) {
                attribs.required = "required";
            }

            markup = _.map(attribs,function (value, name) {

                return name + '="' + escape(value) + '"';

            }).join(' ');

            return this.when(markup);

        },

        /**
         * Will return you a clone of this form, but a populated version (this is so you do not modify a form globally)
         *
         * @param values
         * @returns {forms.lib.Form}
         */
        populate: function (values) {

            var options = {
                schema: this.schema(),
                values:  values
            };

            _.each(this._cloneableProps, function (named) {
                options[named] = this[named];
            }, this);


            return this.parent.forge('lib/Form', options);

        },

        /**
         * Strip out the values we are not rendering.
         *
         * @returns {*}
         */
        getValues: function () {

            var values = this.inherited(arguments);

            values = _.pick(values, _.keys(this.renderableProperties()));

            return values;

        }


    });

});