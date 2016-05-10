(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("Postal", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
// --- dependency modules ----------------------------------
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var _poastlIDCounter = 0; // Integer: PostalID Counter.
// --- class / interfaces ----------------------------------
function Postal() {
    this["_receiver"] = {}; // receiver hash map. { id: receiver, ... }
}

Postal["VERBOSE"] = VERBOSE;
Postal["repository"] = "https://github.com/uupaa/Postal.js";
Postal["prototype"] = Object.create(Postal, {
    "constructor":      { "value": Postal               }, // new Postal():Postal
    "id":               { "value": Postal_id            }, // Postal#id(receiver:ReceiverObject):ReceiverIDString
    "register":         { "value": Postal_register      }, // Postal#register(receiver:ReceiverObject):this
    "unregister":       { "value": Postal_unregister    }, // Postal#unregister(receiver:ReceiverObject):this
    "unregisterAll":    { "value": Postal_unregisterAll }, // Postal#unregisterAll():this
    "to":               { "value": Postal_to            }, // Postal#to(receiver:ReceiverObject = undefined):Envelope
    "omit":             { "value": Postal_omit          }, // Postal#omit(receiver:ReceiverObject):Envelope
    "send":             { "value": Postal_send          }, // Postal#send(message:String, param:Any = undefined, ...):Object
    "post":             { "value": Postal_post          }, // Postal#post(message:String, param:Any = undefined, ...):Object
});

function Envelope(hash, // @arg receiverHashTableObject: registered receiver. { id: object, ... }
                  to) { // @arg StringArray: delivery id. ["id", ...]

    this._receiver = hash; // receiver hash map. { id: receiver, ... }
    this._to = to;         // StringArray: ["id", ...]
}

Envelope["prototype"] = Object.create(Envelope, {
    "constructor":      { "value": Envelope             }, // new Envelope(hash, to):Envelope
    "to":               { "value": Postal_to            }, // Envelope#to(receiver:ReceiverObject):Envelope
    "omit":             { "value": Postal_omit          }, // Envelope#omit(receiver:ReceiverObject):Envelope
    "send":             { "value": Postal_send          }, // Envelope#send(message:String, param:Any = undefined, ...):Object
    "post":             { "value": Postal_post          }, // Envelope#post(message:String, param:Any = undefined, ...):Object
    "list":             { "value": Envelope_list        }, // Envelope#list():ReceiverIDStringArray
});

// --- implements ------------------------------------------
function Postal_id(receiver) { // @arg ReceiverObject - registered receiver
                               // @ret String - postal id.
                               // @desc get postal id.
//{@dev
    if (VERIFY) {
        $valid($type(receiver["inbox"], "Function"), Postal_register, "receiver");
    }
//}@dev

    return receiver["__POSTAL_ID__"] || "";
}

function Postal_register(receiver) { // @arg ReceiverObject - class instance, object
                                     // @ret this
                                     // @desc register the object for message delivery.
//{@dev
    if (VERIFY) {
        $valid($type(receiver["inbox"], "Function"), Postal_register, "receiver");
    }
//}@dev

    var id = Postal_id(receiver);

    if (!id) {
        id = (++_poastlIDCounter).toString();
        if (Object["defineProperty"]) { // [ES5]
            Object["defineProperty"](receiver, "__POSTAL_ID__", { "value": id }); // hidden and shield
        } else { // legacy
            receiver["__POSTAL_ID__"] = id;
        }
    }
    if ( !(id in this["_receiver"]) ) {
        this["_receiver"][id] = receiver;
    }
    return this;
}

function Postal_unregister(receiver) { // @arg ReceiverObject - registered receiver.
                                       // @ret this
                                       // @desc unregister a object.
//{@dev
    if (VERIFY) {
        if (receiver) {
            $valid($type(receiver["inbox"], "Function"), Postal_register, "receiver");
        }
    }
//}@dev

    var id = Postal_id(receiver);

    if (id) {
        delete this["_receiver"][id];
    }
    return this;
}

function Postal_unregisterAll() { // @ret this
                                  // @desc unregister all object.
    this["_receiver"] = {}; // unregister all
    return this;
}

function Postal_to(receiver) { // @arg ReceiverObject = null - delivery to receiver. undefined is all receiver.
                               // @ret Envelope
                               // @desc set delivery objects.
//{@dev
    if (VERIFY) {
        if (receiver) {
            $valid($type(receiver["inbox"], "Function"), Postal_register, "receiver");
        }
    }
//}@dev

    var to = this instanceof Postal ? [] : this["_to"]; // receiverIDStringArray: ["id", ...]

    if (!receiver) { // to all
        to = Object.keys(this["_receiver"]);
    } else { // to receiver
        if (to.indexOf( Postal_id(receiver) ) < 0) {
            to.push( Postal_id(receiver) );
        }
    }
    if (this instanceof Postal) {
        return new Envelope(this["_receiver"], to);
    }
    this["_to"] = to;
    return this; // Envelope
}

function Postal_omit(receiver) { // @arg ReceiverObject - omit receiver.
                                 // @ret Envelope
                                 // @desc omit receiver.
//{@dev
    if (VERIFY) {
        $valid($type(receiver["inbox"], "Function"), Postal_register, "receiver");
    }
//}@dev

    var to = this instanceof Postal ? Object.keys(this["_receiver"]) : this["_to"];
    var pos = to.indexOf( Postal_id(receiver) );

    if (pos >= 0) {
        to.splice(pos, 1);
    }
    if (this instanceof Postal) {
        return new Envelope(this["_receiver"], to);
    }
    return this;
}

function Postal_send(message       // @arg String - message
                     /*, ... */) { // @var_args Any - inbox params. inbox(message, param, ...)
                                   // @ret Object - { id: result:Any|Error, ... }
                                   // @desc send a message synchronously.
//{@dev
    if (VERIFY) {
        $valid($type(message, "String"), Postal_send, "message");
        $valid(message.length,           Postal_send, "message");
    }
//}@dev

    var resultValues = {}; // { id: resultValue, ... }
    var args = Array.prototype.slice.call(arguments);
    var to = this instanceof Postal ? Object.keys(this["_receiver"]) // Broadcast
                                    : this["_to"];                   // Envelope._to
    // sync send
    for (var i = 0, iz = to.length; i < iz; ++i) {
        var id = to[i];
        var receiverObject = this["_receiver"][id];

        if (receiverObject) { // alive?
            resultValues[id] = receiverObject["inbox"].apply(receiverObject, args);
        }
    }
    return resultValues;
}

function Postal_post(message       // @arg String - message
                     /*, ... */) { // @var_args Any - inbox params. inbox(message, param, ...)
                                   // @ret Object - empty object
                                   // @desc post a message asynchronously.
//{@dev
    if (VERIFY) {
        $valid($type(message, "String"), Postal_post, "message");
        $valid(message.length,           Postal_post, "message");
    }
//}@dev

    var that = this;
    var args = Array.prototype.slice.call(arguments);
    var to = this instanceof Postal ? Object.keys(this["_receiver"]) // Broadcast
                                    : this["_to"];                   // Envelope._to
    // async post
    setTimeout(function() {
        for (var i = 0, iz = to.length; i < iz; ++i) {
            var id = to[i];
            var receiverObject = that["_receiver"][id];

            if (receiverObject) { // alive?
                receiverObject["inbox"].apply(receiverObject, args);
            }
        }
    }, 0);
    return {};
}

function Envelope_list() { // @ret ReceiverIDStringArray - [id, ...]
                           // @desc enum registered list.
    return [].concat(this._to); // clone
}

return Postal; // return entity

});

