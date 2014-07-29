/**
 * Help us resolve Controllers
 *
 * {{Vendor}}:*\/controllers/{{Name}}
 *
 *
 */
define(['altair/facades/declare',
    'altair/cartridges/nexus/_ResolverBase'
], function (declare,
             _ResolverBase) {

    return declare([_ResolverBase], {


        foundry:          null,

        constructor: function (foundry) {
            this.foundry = foundry;
            if(!foundry) {
                throw "The Controllers nexus resolver needs a controller foundry.";

            }
        },

        /**
         * Find the controller of your choosing. If you passed a namespace, eg slimgenics:* then we'll return the first
         * controller in that namespace. if you put the full
         *
         * @param key
         * @param options
         * @param config
         * @returns {*}
         */
        resolve: function (key, options, config) {
            return (this.foundry.hasNamespace(key)) ? this.foundry.controllersInNamespace(key)[0] : this.foundry.controller(key);
        },

        /**
         * Tells us if we handle a key.
         *
         * @param key
         * @returns {boolean}
         */
        handles: function (key) {
            return this.foundry.hasNamespace(key) || this.foundry.hasController(key);
        }

    });

});