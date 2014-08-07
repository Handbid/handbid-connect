/**
 * Allow us to run some nexus tests
 */

define(['doh/runner',
    'core/tests/support/boot',
    'altair/plugins/node!path',
    'module'],

    function (doh, boot, pathUtil, module) {


        var widgetPath = pathUtil.join(module.uri, '..', '..', 'widgets/form/views'),
            cartridges = [
                {
                    path:    'altair/cartridges/apollo/Apollo',
                    options: {
                    }
                },
                {
                    path:    'altair/cartridges/nexus/Nexus',
                    options: {
                    }
                },
                {
                    path:    'altair/cartridges/database/Database',
                    options: {
                    }
                },
                {
                    path:    'altair/cartridges/module/Module',
                    options: {
                        modules:       [
                            'liquidfire:Forms',
                            'liquidfire:Onyx',
                            'titan:Alfred',
                            'altair:CommandCentral',
                            'altair:Adapters',
                            'altair:Events'
                        ],
                        moduleOptions: {
                            'altair:CommandCentral': {
                                'autostart': 0
                            }
                        }
                    }
                },
                {
                    path:    'altair/cartridges/extension/Extension',
                    options: {
                        extensions: [
                            'altair/cartridges/extension/extensions/Paths',
                            'altair/cartridges/extension/extensions/Config',
                            'altair/cartridges/extension/extensions/Package',
                            'altair/cartridges/extension/extensions/Deferred',
                            'altair/cartridges/extension/extensions/Apollo',
                            'altair/cartridges/extension/extensions/Log',
                            'altair/cartridges/extension/extensions/Nexus',
                            'altair/cartridges/extension/extensions/Events',
                            'altair/cartridges/extension/extensions/Foundry'
                        ]
                    }
                }
            ],
            altairOptions = {
                paths: [
                    'app',
                    'community',
                    'core'
                ]
            },
            formSchema = {
                properties: {
                    firstName: {
                        type:    'string',
                        options: {
                            label:     'First Name',
                            'default': 'Taylor'
                        }
                    },
                    lastName:  {
                        type:    'string',
                        form:    {
                            include: false
                        },
                        options: {
                            label:     'First Name',
                            'default': 'Taylor'
                        }
                    }
                }
            };


        doh.register('forms', {

            'test creating form and setting values': function (t) {

                return boot.nexus(cartridges, altairOptions).then(function (nexus) {

                    var forms = nexus('liquidfire:Forms');

                    return forms.form(formSchema);


                }).then(function (form) {

                    t.is('Taylor', form.get('firstName'), 'Form schema set wrong');

                    form.set('firstName', 'becca');

                    t.is('becca', form.get('firstName'), 'Form set() not working');

                });

            },

            'test renderable properties':                function (t) {

                return boot.nexus(cartridges, altairOptions).then(function (nexus) {

                    var forms = nexus('liquidfire:Forms');

                    return forms.form(formSchema);


                }).then(function (form) {

                    return form.renderableProperties();

                }).then(function (props) {

                    t.t(!!props.firstName, 'renderable prop missing');
                    t.f(!!props.lastName, 'non-renderable prop found');

                });

            },
            'test creating form and generate templates': function (t) {

                return boot.nexus(cartridges, altairOptions).then(function (nexus) {

                    var forms = nexus('liquidfire:Forms');

                    return forms.form(formSchema);


                }).then(function (form) {

                    return form.templates([ widgetPath ]);

                }).then(function (templates) {

                    t.is(pathUtil.join(widgetPath, 'property.ejs'), templates.firstName, 'template resolution did not return expected results');

                });

            }


        });


    });