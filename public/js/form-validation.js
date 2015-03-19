(function($) {

    $( ".signup-form form" ).submit(function( e ) {
        validateForm($('.signup-form form input:not([type="hidden"], [type="checkbox"])'), e);
        validateFormCheckbox($('.signup-form form input[type="checkbox"]'), e);
    });

    $( ".login-form form" ).submit(function( e ) {
        validateForm($('.login-form form input:not([type="hidden"])'), e);
    });

    function validateForm(elements, e) {
        $.each(elements, function(i, v) {

            var el = $(v);

            el.css('border', '0');

            if(v.value == '') {
                console.log(v);
                el.css('border', '1px solid red');
                e.preventDefault();
            }

        });
    }

    function validateFormCheckbox(elements, e) {
        $.each(elements, function(i, v) {

            $('label[for="agreeToTerms"]').css('color', '#fff');

            if(v.checked == false) {

                $('label[for="agreeToTerms"]').css('color', 'red');

                e.preventDefault();
            }

        });
    }

})(jQuery);