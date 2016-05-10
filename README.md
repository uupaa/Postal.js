# Postal.js [![Build Status](https://travis-ci.org/uupaa/Postal.js.svg)](https://travis-ci.org/uupaa/Postal.js)

[![npm](https://nodei.co/npm/uupaa.postal.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.postal.js/)

Message delivery subsystem (Observer pattern implementation).

This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Spec](https://github.com/uupaa/Postal.js/wiki/)
- [API Spec](https://github.com/uupaa/Postal.js/wiki/Postal)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/Postal.js"></script>
<script>

var receiverObject = {
        inbox: function(message) { // message -> "Hello"
            return true;
        }
    };

var postal = new Postal();

postal.register(receiverObject);
postal.to().send("Hello");
postal.unregister(); // unregister all

</script>
```

## WebWorkers

```js
importScripts("<module-dir>/lib/WebModule.js");
importScripts("<module-dir>/lib/Postal.js");

```

## Node.js

```js
require("<module-dir>/lib/WebModule.js");
require("<module-dir>/lib/Postal.js");

```

