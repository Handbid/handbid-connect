# Alfred

A super simple, super thin module designed to provide a simple MVC architecture for web apps in [Altair](https://github.com/liquidg3/altair)
using [expressjs](https://github.com/visionmedia/express).

As with the Altair team core values regarding Committing on a convention, Alfred uses [Consolodate.js](https://github.com/visionmedia/consolidate.js/)
( can be swapped out to meet your needs ). Consolodate supports a vast number of template engines that all of the
hipsters can fight over which one is better, while they do that we can continue to make tomorrow more productive than today.


## Creating your first site

```bash
$ cd path/to/any/dir
$ altair alfred forge
```

This will walk you through creating your first site. It's pretty simple.

## Structure
From the root directory you selected to configure your routes, you will need a few folders. For this example we are using expressjs and the [.ejs](https://github.com/visionmedia/ejs) files but the file structure will be the same.

```
- /
    - configs
        - alfred.json ( contains routes, configs, javascript, database adapter settings, node and altair dependencies )
        - alfred-dev.json ( override for your dev environment )
        - ... (there are a few more files Altair drops in for your convenience);
    - controllers
        - index.js ( controller for root page )
        - user.js
        - admin.js
    - public
        - js
            - all your js files go here
        - css
            - all your css files go here
        - less
            - guess what goes here? ... you guessed it, all of your less files go here!
    - views
        - layout.ejs ( Example Below )
        - admin
            - dashboard.ejs
        - index
            - index.ejs
            - login.ejs
        - layouts
            - admin.ejs ( view for admin layouts )
            - user.ejs
            - front.ejs
```


## Configuring routes
Once your site has been forged, you can configure alfred in 1 of 2 places.

`/path/to/site/configs/alfred.json` and `/path/to/site/configs/alfred-dev.json`

The `alfred-dev.json` config will override anything in `alfred.json`.


## Example layout.ejs
If you are using ejs you can define your main layout this way and <%- body %> will be the view you defined in the controller

```

    <!DOCTYPE html>
    <head>
        <title><%= title %></title>
        <%- css %>
    </head>

    <body class="page-body <%= bodyClass %>">
        <div class="login-container">
            <%- body %>
            <%- myCustomCode %> <!-- Compile time include tags can be setup in the render of the controller -->
        </div>
        <%- js %>
    </body>
    </html>
```

## Controller Stub
The default stub layout for a controller defining the startup and index ( on page load ) stubs, if you wish to add in your own
compile time include tags you can do so by passing it into the render of the view. In this example we are creating the
supporting myCustomCode include from the above example.

```

    define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/events/Emitter'
    ], function(declare, Lifecycle, Emitter) {

        return declare([Lifecycle, Emitter], {
            startup: function (options) {
                return this.inherited(arguments);
            },
            index: function(e) {
                return e.get('view').render({
                    myCustomCode: "Taco Fight"
                });
            }
        });
    });

```

## Launching your web server
Now that we have all that set up....

``` bash
$ cd /path/to/site
$ altair
```

Is all you need to get started!

## Troubleshooting
If you do not see your files getting included properly ( css, js, etc... ) restart the alfred server
