var ModuleTestPostal = (function(global) {

var test = new Test(["Postal"], { // Add the ModuleName to be tested here (if necessary).
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    });

test.add([
    testPostal_postableObject,
    testPostal_to,
    testPostal_omit,
    testPostal_assert,
    testPostal_unregister,
    testPostal_reuseEnvelope,
    testPostal_directBroadcast,
    testPostal_multiplePostal,
]);

// --- test cases ------------------------------------------
function testPostal_postableObject(test, pass, miss) {

    // PostableClass
    function PostableClass() {}
    PostableClass.prototype.inbox = function(message, param1, param2) {
        return "PostableClass";
    }
    var postableClass = new PostableClass();

    // PostableObject
    var postableObject = {
        inbox: function(message, param1, param2) {
            return "postableObject";
        }
    };

    var postal = new Postal();
    var postableClass = new PostableClass();

    postal.register(postableClass);
    postal.register(postableObject);

    var result = postal.to().send("hello");

    if (result[ postal.id(postableClass)  ] === "PostableClass" &&
        result[ postal.id(postableObject) ] === "postableObject") {
        console.log("testPostableObject ok");
        test.done(pass());
    } else {
        console.log("testPostableObject ng");
        test.done(miss());
    }
}

function testPostal_to(test, pass, miss) {
    function Foo() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Foo#inbox", arg1, arg2);
        return "Foo";
    };

    function Bar() { }
    Bar.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Bar#inbox", arg1, arg2);
        return "Bar";
    };

    var foo = new Foo();
    var bar = new Bar();
    var postal = new Postal();

    postal.register(foo).register(bar);

    var result1 = postal.to().send("hello");              // Foo#inbox と Bar#inbox にメッセージが届きます
    if (result1[ postal.id(foo) ] === "Foo" &&
        result1[ postal.id(bar) ] === "Bar") {

        var result2 = postal.to(foo).to(bar).send("hello");   // Foo#inbox と Bar#inbox にメッセージが届きます
        if (result2[ postal.id(foo) ] === "Foo" &&
            result2[ postal.id(bar) ] === "Bar") {

            var result3 = postal.to(foo).to(foo).to(bar).send("hello"); // Foo#inbox と Bar#inbox にメッセージが届きます
            if (result3[ postal.id(foo) ] === "Foo" &&
                result3[ postal.id(bar) ] === "Bar") {

                console.log("testTo ok");
                test.done(pass());
                return;
            }
        }
    }
    console.log("testTo ng");
    test.done(miss());
}

function testPostal_omit(test, pass, miss) {
    function Foo() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Foo#inbox", arg1, arg2);
        return "Foo";
    };

    function Bar() { }
    Bar.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Bar#inbox", arg1, arg2);
        return "Bar";
    };

    var foo = new Foo();
    var bar = new Bar();
    var postal = new Postal();

    postal.register(foo).register(bar);

    var result1 = postal.omit(bar).send("hello"); // Foo#inbox にメッセージが届きます
    if (result1[ postal.id(foo) ] === "Foo" &&
        result1[ postal.id(bar) ] !== "Bar") {

        var result2 = postal.to().omit(bar).send("hello"); // Foo#inbox にメッセージが届きます
        if (result2[ postal.id(foo) ] === "Foo" &&
            result2[ postal.id(bar) ] !== "Bar") {

            var result3 = postal.to(bar).omit(bar).send("hello"); // どこにもメッセージは届きません
            if (result3[ postal.id(foo) ] !== "Foo" &&
                result3[ postal.id(bar) ] !== "Bar") {

                console.log("testOmit ok");
                test.done(pass());
                return;
            }
        }
    }
    console.log("testOmit ng");
    test.done(miss());
}

function testPostal_assert(test, pass, miss) {
    function UnPostable() { }

    var unpostable = new UnPostable();
    var postableClass = { inbox: function() {} };
    var postal = new Postal();

    var task = new Task("testPostal_assert", 6, function(err, buffer, task) {
            if (err) {
                console.log("testAssert ng");
                test.done(miss());
            } else {
                console.log("testAssert ok");
                test.done(pass());
            }
        });

    try {
        postal.register(unpostable); // -> error
        task.miss();
console.log(1);
    } catch (err) {
        task.pass();
    }

    try {
        postal.unregister(unpostable); // -> error
        task.miss();
console.log(2);
    } catch (err) {
        task.pass();
    }

    try {
        postal.to(unpostable); // -> error
        task.miss();
console.log(3);
    } catch (err) {
        task.pass();
    }

    try {
        postal.omit(unpostable); // -> error
        task.miss();
console.log(4);
    } catch (err) {
        task.pass();
    }

    try {
        postal.send(""); // -> error
        task.miss();
console.log(5);
    } catch (err) {
        task.pass();
    }

    try {
        postal.post(""); // -> error
        task.miss();
console.log(6);
    } catch (err) {
        task.pass();
    }
}

function testPostal_unregister(test, pass, miss) {
    function Foo() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Foo#inbox", arg1, arg2);
        return "Foo";
    };

    function Bar() { }
    Bar.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Bar#inbox", arg1, arg2);
        return "Bar";
    };

    function Buz() { }
    Buz.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Buz#inbox", arg1, arg2);
        return "Buz";
    };

    var foo = new Foo();
    var bar = new Bar();
    var buz = new Buz();
    var postal = new Postal();

    { // dummy
        postal.register(foo);
        postal.register(bar);
        postal.register(buz);
        postal.unregister(); // reset (unregister all)

        postal.register(foo);
        postal.unregister(foo);
    }

    // register buz
    postal.register(buz);

    var result = postal.to().send("hello");

    if (result[ postal.id(buz)  ] === "Buz") {
        console.log("testUnregister ok");
        test.done(pass());
    } else {
        console.log("testUnregister ng");
        test.done(miss());
    }
}

function testPostal_reuseEnvelope(test, pass, miss) {
    function Foo() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Foo#inbox", arg1, arg2);
        return "Foo";
    };

    function Bar() { }
    Bar.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Bar#inbox", arg1, arg2);
        return "Bar";
    };

    function Buz() { }
    Buz.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Buz#inbox", arg1, arg2);
        return "Buz";
    };

    var foo = new Foo();
    var bar = new Bar();
    var buz = new Buz();
    var postal = new Postal().register(foo).register(bar).register(buz);

    var envelope = postal.to(foo).to(bar).to(buz).
                          to(foo).to(bar).to(buz); // avoid duplicate receiver

    if (envelope.list().length === 3) {
        var result1 = envelope.send("Hello");
        var result2 = envelope.send("World");

        if (result1[ postal.id(foo) ] === "Foo" &&
            result1[ postal.id(bar) ] === "Bar" &&
            result1[ postal.id(buz) ] === "Buz") {

            if (result2[ postal.id(foo) ] === "Foo" &&
                result2[ postal.id(bar) ] === "Bar" &&
                result2[ postal.id(buz) ] === "Buz") {

                console.log("testReuseEnvelope ok");
                test.done(pass());
                return;
            }
        }
    }
    console.log("testReuseEnvelope ng");
    test.done(miss());
}

function testPostal_directBroadcast(test, pass, miss) {
    function Foo() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Foo#inbox", arg1, arg2);
        return "Foo";
    };

    function Bar() { }
    Bar.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Bar#inbox", arg1, arg2);
        return "Bar";
    };

    function Buz() { }
    Buz.prototype.inbox = function(msg, arg1, arg2) {
      //console.log("Buz#inbox", arg1, arg2);
        return "Buz";
    };

    var foo = new Foo();
    var bar = new Bar();
    var buz = new Buz();
    var postal1 = new Postal().register(foo).register(bar).register(buz);

    var result1 = postal1.send("Hello");
    var result2 = postal1.post("World");

    if (result1[ postal1.id(foo) ] === "Foo" &&
        result1[ postal1.id(bar) ] === "Bar" &&
        result1[ postal1.id(buz) ] === "Buz") {

        if (Object.keys(result2).length === 0) {

            console.log("testDirectBroadcast ok");
            test.done(pass());
            return;
        }
    }
    console.log("testDirectBroadcast ng");
    test.done(miss());
}

function testPostal_multiplePostal(test, pass, miss) {
    var task = new Task("testPostal_multiplePostal", 7, function(err, buffer, task) {
            if (err) {
                console.log("testMultiplePostal ng");
                test.done(miss());
            } else {
                console.log("testMultiplePostal ok");
                test.done(pass());
            }
        });

    function Foo() { }
    function Bar() { }
    function Buz() { }
    Foo.prototype.inbox = function(msg, arg1, arg2) {
        task.pass(); // pass x 2
        return "Foo";
    };
    Bar.prototype.inbox = function(msg, arg1, arg2) {
        task.pass(); // pass x 2
        return "Bar";
    };
    Buz.prototype.inbox = function(msg, arg1, arg2) {
        task.pass(); // pass x 2
        return "Buz";
    };

    var foo = new Foo();
    var bar = new Bar();
    var buz = new Buz();
    var postal1 = new Postal().register(foo).register(bar).register(buz);
    var postal2 = new Postal().register(foo).register(bar).register(buz);

    postal2.unregister();

    var result1 = postal1.send("Hello");
    var result2 = postal1.post("World");

    if (result1[ postal1.id(foo) ] === "Foo" &&
        result1[ postal1.id(bar) ] === "Bar" &&
        result1[ postal1.id(buz) ] === "Buz") {

        if (Object.keys(result2).length === 0) {
            task.pass(); // pass x 1
            return;
        }
    }
    task.miss();
}

return test.run();

})(GLOBAL);

