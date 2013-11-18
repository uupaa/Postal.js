// --- define ----------------------------------------------
// --- variable --------------------------------------------
var test = new UnitTest([
        testPostableObject,
        testTo,
        testOmit,
        testAssert,
        testUnregister,
        testReuseEnvelope,
        testDirectBroadcast,
    ]);

// --- interface -------------------------------------------
// --- implement -------------------------------------------
function _init() {
    // create <input> buttons.
    if (typeof document !== "undefined") {
        test.names().forEach(function(name) {
            //  <input type="button" onclick="testX()" value="testX()" /> node.
            document.body.appendChild(
                _createNode("input", {
                    type: "button",
                    value: name + "()",
                    onclick: name + "()" }));
        });
        window.addEventListener("error", function(message, lineno, filename) {
            document.body.style.backgroundColor = "red";
        });
    }
    // run
    test.run(function(err) {
        if (typeof document !== "undefined") {
            document.body.style.backgroundColor = err ? "red" : "lime";
        } else {
            // console color
            var RED    = '\u001b[31m';
            var YELLOW = '\u001b[33m';
            var GREEN  = '\u001b[32m';
            var CLR    = '\u001b[0m';

            if (err) {
                console.log(RED + "error." + CLR);
            } else {
                console.log(GREEN + "ok." + CLR);
            }
        }
    });

    function _createNode(name, attrs) {
        var node = document.createElement(name);

        for (var key in attrs) {
            node.setAttribute(key, attrs[key]);
        }
        return node;
    }
}

function testPostableObject(next) {
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
        next && next.pass();
    } else {
        console.log("testPostableObject ng");
        next && next.miss();
    }
}

function testTo(next) {
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
                next && next.pass();
                return;
            }
        }
    }
    console.log("testTo ng");
    next && next.miss();
}

function testOmit(next) {
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
                next && next.pass();
                return;
            }
        }
    }
    console.log("testOmit ng");
    next && next.miss();
}

function testAssert(next) {
    function UnPostable() { }

    var unpostable = new UnPostable();
    var postableClass = { inbox: function() {} };
    var postal = new Postal();

    var task = new Task(6, function(err, args) {
            if (err) {
                console.log("testAssert ng");
                next && next.miss();
            } else {
                console.log("testAssert ok");
                next && next.pass();
            }
        });

    try {
        postal.register(unpostable); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }

    try {
        postal.unregister(unpostable); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }

    try {
        postal.to(unpostable); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }

    try {
        postal.omit(unpostable); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }

    try {
        postal.send(""); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }

    try {
        postal.post(""); // -> error
        task.miss();
    } catch (err) {
        task.pass();
    }
}

function testUnregister(next) {
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

    postal.register(foo);
    postal.register(bar);
    postal.register(buz);
    postal.unregister();

    postal.register(foo);
    postal.unregister(foo);
    postal.register(buz);

    var result = postal.to().send("hello");

    if (result[ postal.id(buz)  ] === "Buz") {
        console.log("testUnregister ok");
        next && next.pass();
    } else {
        console.log("testUnregister ng");
        next && next.miss();
    }
}

function testReuseEnvelope(next) {
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
                next && next.pass();
                return;
            }
        }
    }
    console.log("testReuseEnvelope ng");
    next && next.miss();
}

function testDirectBroadcast(next) {
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

    var result1 = postal.send("Hello");
    var result2 = postal.post("World");

    if (result1[ postal.id(foo) ] === "Foo" &&
        result1[ postal.id(bar) ] === "Bar" &&
        result1[ postal.id(buz) ] === "Buz") {

        if (result2[ postal.id(foo) ] === "Foo" &&
            result2[ postal.id(bar) ] === "Bar" &&
            result2[ postal.id(buz) ] === "Buz") {

            console.log("testDirectBroadcast ok");
            next && next.pass();
            return;
        }
    }
    console.log("testDirectBroadcast ng");
    next && next.miss();
}

// --- export ----------------------------------------------

// --- run ----------------------------------------------
if (this.self) {
    this.self.addEventListener("load", _init);
} else {
    _init();
}

