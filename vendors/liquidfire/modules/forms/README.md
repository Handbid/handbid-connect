# liquidfire:Forms
An Altair module to help with form related activity (rendering, submission, etc). 'Forms' comes with 2 parts, the form
and the widget. The form is a simple [apollo/\_HasSchemaMixin](https://github.com/liquidg3/altair/tree/master/core/lib/apollo)
object with additional helpers to facilitate form related activities (enctype, method, action, etc.).

## Setup dependencies
``` json
"altairDependencies": {
    "liquidfire:Forms": ">=0.0.x"
}
```

## Form widget
Using the form widget is the way to go when working with forms. The widget will create a form for you and because there
is no real reason to create a form without rendering it you will rarely need to create a form directly.
In the example below, we'll assume that the signup(e) method is a configured action in an
[Alfred](https://github.com/hemstreet/Titan-Alfred) website.

``` js
...
signup: function (e) {

    //forge a form widget, its options are passed through directly to the form you are creating
    return this.widget('liquidfire:Forms/widgets/Form.my-great-form', {
        enctype: 'multipart/form-data',
        formSchema: {
            properties: {

                firstName: {
                    type: 'string',
                    options: {
                        label: 'First Name',
                        description: 'This is your first name'
                    }
                },

                lastName: {
                    type: 'string',
                    form: {
                        template: 'vendor:Module/views/my-view.ejs'
                    }
                    options: {
                        label: 'Last Name'
                    }
                },

                token: {
                    type: 'string',
                    form: {
                        include: false //will keep this property from being rendered in the form
                    },
                    options: {
                        label: 'Token'
                    }
                },

                role: {
                    type: 'string',
                    form: {
                        hidden: true
                    },
                    options: {
                        label: 'Role id?',
                        description: 'This is a bad example of why you\'d want a hidden field'
                    }
                }
            }
        },
        formValues: {
            firstName: 'Tay',
            lastName: 'Ro'
        }
    }).then(function (widget) {

        //we can save this widget for later, or just render it immediately
        return widget.render();

    }).then(function (html) {

        //i'm not doing anything
        console.log(html);

    });

},
....

```

## Creating a form directly
If you want to use a form directly (from outside the widget and rendering) you can create them easily. I haven't needed
to create a form directly because I'm always rendering them and the widget creates it for me, but here is how you can
do it, just in case.

``` js
//create a form off the forms module
this.nexus('liquidfire:Forms').form({
    schema: ...,
    values: ...
    id: 'my-great-form'
}).then(function () {

});

```

## Form Submission
Forms are fully "eventized," so when you want to listen into a form event, you do it using the `on()` syntax you are used
to. Remember, always hook into events in your module's or controller's `startup(options)`.

```js

startup: function (options) {

    //hook into the forms did-submit-form event, see package.json for all events
    this.on('liquidfire:Forms::did-submit-form', {
        'form.id': 'my-great-form'
    }).then(this.hitch('onSubmitMyGreatForm'));

    return this.inherited(arguments);

},

onSubmitMyGreatForm: function (e) {

    var form    = e.get('form'),
        values  = form.getValues();

    console.log(values);

}

```
## Form widget options
You can customize the form widget using these options. You can always check the widgets/form/config/schema.json for a
more in-depth review of the options.

View the [widget's schema](widgets/form/configs/schema.json) to see what it can do.

## Form options
These are options you can pass a form.

- **id**: (required) the id of the form
- **schema**: (required) the apollo schema that this form will use for its properties
- **enctype**: defaults to 'application/x-www-form-urlencoded'
- **action**: dropped into the "action" property of the form
- **method**: 'GET'|'POST' defaults to GET

## Form schema options
By passing a `form` block in your schema's properties, you can customize a few aspects of the form.

```json
properties: {
    firstName: {
        type: 'string',
        form: {
            include: true|false, //should be included in form
            hidden:  true|false, //will render as hidden element at bottom of the form
        },
        options: {
            ... apollo property options ...
        }
    }
}

```
##Custom template