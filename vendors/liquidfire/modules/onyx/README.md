# liquidfire:Onyx
A view engine. It is a simple promise based wrapper for [visionmedia/consolidate.js](https://github.com/visionmedia/consolidate.js).
It also introduces some helpful extensions to your module and sub components as well as auto-picks template engine based
on the file extension.

## Extensions

- **render(path, context, options)**: render any view script with the passed context. You can also pass additional options.

## Examples
``` js
define(['altair/facades/declare',
        'altair/Lifecycle'
], function (declare,
             Lifecycle) {

    return declare([Lifecycle], {

        onDoingSomethingImportant: function (e) {

            //pass any extension you want, as long
            return this.render('views/view.ejs', {
                foo: 'bar' //foo is available from the view
            }).then(this.hitch(function (markup) {
                this.log(markup);
                return markup;
            }));

        }

    });

});
```

