define(['altair/facades/declare',
        './_Base'
], function (declare,
             _Base) {

    return declare(_Base, {

        _extensions: ['js'],
        renderItem: function (item) {

            return '<script src="' + item + '"></script>';


        }

    });

});