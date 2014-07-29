define(['altair/facades/declare',
        'altair/Lifecycle',
        'apollo/_HasSchemaMixin',
        'altair/plugins/config!./schema.json'
], function (declare,
             Lifecycle,
             _HasSchemaMixin,
             schema) {

    return declare([Lifecycle, _HasSchemaMixin], {
        _schema: schema,
        http: function () {
            throw new Error('You need to implement http() on your adapter and it should return an http server.');
        },

        router: function () {
            return this.options.router;
        }
    });

});
