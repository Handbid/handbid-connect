define(['altair/facades/declare',
        'altair/Lifecycle',
        'apollo/_HasSchemaMixin',
        'altair/facades/sprintf',
        'lodash'
], function (declare,
             Lifecycle,
             _HasSchemaMixin,
             sprintf,
             _) {

    return declare([Lifecycle, _HasSchemaMixin], {

        context: function () {

            var schema      = this.get('formSchema'),
                values      = this.get('formValues'),
                viewPaths   = this.get('viewPaths', []),
                form;

            //load a form using the schema
            return this.parent.form(_.defaults({
                id: this.instanceId,
                schema: schema,
                enctype: this.get('enctype')
            }, this.get('formOptions'))).then(this.hitch(function (form) {

                //pass through settings
                form.method = this.get('method');

                //populate the form if necessary
                if(values) {
                    return form.populate(values);
                } else {
                    return form;
                }

            })).then(this.hitch(function (_form) {

                //we'll need the form for later
                form = _form;

                //use form to find templates
                return form.templates(viewPaths, this.dir + 'views');

            })).then(this.hitch(function (templates) {

                var rows        = [],
                    row         = 0,
                    maxCols     = this.get('maxCols', 12),
                    colClass    = this.get('colClass', 'col-md-%d'),
                    currentCol  = 0,
                    rendered    = {},
                    hiddenProps = [],
                    properties  = form.renderableProperties(),
                    visibleProps = [];

                //split props into rows and drop in classes, templates, and html attributes, then render templates
                _.each(properties, function (prop) {

                    var cols = _.has(prop, 'form') && _.has(prop.form, 'col') ? prop.form.col : maxCols,
                        isHidden = form.isHidden(prop.name);

                    //if it's not hidden, calculate column and row
                    if(!isHidden) {

                        //add to list op visible props
                        visibleProps.push(prop);

                        if(cols + currentCol > maxCols) {
                            row = row + 1;
                            currentCol = cols;
                        } else {
                            currentCol += cols;
                        }

                        if(!rows[row]) {
                            rows[row] = [];
                        }

                        //classname of wrapper
                        prop.className  = sprintf(colClass, cols);

                        //add to rows
                        rows[row].push(prop);


                    }
                    //if it is hidden, add to hiddenProps and remove from props so we don't double render
                    else {
                        hiddenProps.push(prop);
                    }

                    //always pass the template
                    prop.template   = templates[prop.name];

                    //render html attributes and lastly, the property
                    rendered[prop.name] = form.renderPropertyAttributes(prop).then(this.hitch(function (attribs) {

                        //set the attribs and the value to the property
                        prop.attributes = attribs;

                        //get the value
                        return this.when(form.get(prop.name));

                    })).then(this.hitch(function (value) {

                        //get the property type object i ncase it has a "render" method on it
                        var type = form.schema().propertyType(prop.type);

                        if(_.isUndefined(value)) {
                            prop.value = '';
                        } else {
                            prop.value = value;
                        }

                        return (type.render) ? type.render(prop.template, prop) : this.parent.render(prop.template, prop);

                    }));

                }, this);


                return this.all({
                    form: form, //so we have action, method, enctype, and other form specific properties
                    rows: rows, //properties in rows
                    rendered: this.all(rendered), //already rendered form elements
                    properties: visibleProps, //all properties in the order they are in the schema
                    hiddenProperties: hiddenProps
                });

            }));



        }

    });

});