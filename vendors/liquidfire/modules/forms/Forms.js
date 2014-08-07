define(['altair/facades/declare',
    'altair/Lifecycle',
    'apollo/Schema',
    'altair/facades/mixin',
    'altair/events/Emitter',
    'lodash'

], function (declare, Lifecycle, Schema, mixin, Emitter, _) {

    return declare([Lifecycle, Emitter], {

        _forms: {}, //form cache

        startup: function (options) {


            //hook into requests to see if forms were submitted
            this.on('titan:Alfred::did-receive-request').then(this.hitch('onDidReceiveRequest'));

            return this.inherited(arguments);

        },

        /**
         * Get a form yo!
         *
         * @param options
         * @param values
         * @returns {altair.Promise}
         */
        form: function (options) {

            var _options = options || {},
                schema = _options.schema,
                values = _options.values,
                formId = _options.id,
                dfd;

            if (!formId) {
                dfd = new this.Deferred();
                dfd.reject(new Error('Forms need an id and schema'));
            }

            else if (_.has(this._forms, formId)) {

                dfd = this._forms[formId];

            } else {

                if (!schema) {

                    dfd = new this.Deferred();
                    dfd.reject(new Error('Form is invalid (no schema). This can happen because a form needs to be rendered once before it can be submitted.'));

                } else {

                    //turn generic object into schema
                    if (!schema.isInstanceOf || !schema.isInstanceOf(Schema)) {
                        schema = this.nexus('cartridges/Apollo').createSchema(schema);
                    }

                    dfd = this._forms[formId] = this.forge('lib/Form', _options);

                }


            }


            return dfd.then(function (form) {

                if (values) {
                    return form.populate(values);
                } else {
                    return form;
                }

            });

        },

        /**
         * When a request was received, lets see about form submissions.
         *
         * @param e
         */
        onDidReceiveRequest: function (e) {

            var r = e.get('request'),
                form,
                dfd,
                multiForm,
                formId = r.get('altair-form-id'),
                values = mixin(r.query(), r.post());

           if(formId) {

                return this.form({
                    id:     formId,
                    values: values
                }).then(this.hitch(function (_form) {

                    form = _form;

                    //should we auto handle submit?
                    var methods = _form.autoHandleSubmit ? ['fromFormSubmissionValue', 'toJsValue'] : ['noop'];

                    return this.all(form.getValues({}, { methods: methods, event: e }));

                })).then(this.hitch(function (values) {

                    var data = e.data;
                    data.form = form;

                    form.values = values;

                    return this.emit('did-submit-form', data);

                }));

            }

        }

    });

});