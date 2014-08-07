define(['altair/facades/declare',
        'altair/cartridges/extension/extensions/_Base',
        'altair/Deferred',
        'altair/plugins/node!path',
        'altair/facades/mixin',
        'altair/facades/hitch'],

    function (declare,
              _Base,
              Deferred,
              pathUtil,
              mixin,
              hitch) {

        return declare([_Base], {

            name: 'controller-model',
            _handles: ['controller'],
            extend: function (Module) {

                Module.extendOnce({
                    modelPath: './models',
                    _models: {},
                    model: function (named, options, config) {

                        var _p = this.resolvePath(pathUtil.join(this.modelPath, named)),
                            _c = mixin({
                                type: 'model',
                                name: this.name.split('/')[0] + '/models/' + named
                            }, config || {});

                        //if it's a nexus name, pass it off
                        if(named.search(':') > 0) {
                            return this.nexus(named, options, config);
                        }

                        if(this._models[named]) {
                            return this._models[named];
                        }

                        this._models[named] = this.forge(_p, options, _c);

                        return this._models[named];

                    }
                });

                return this.inherited(arguments);
            }

        });


    });