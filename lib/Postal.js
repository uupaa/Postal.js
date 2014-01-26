// @name: Postal.js

(function(global) {

// --- variable --------------------------------------------
var inNode = "process" in global;
var _poastlIDCounter = 0; // Integer: PostalID Counter.

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function Postal() { // @help: Postal
                    // @desc:  Message delivery utility (Observer pattern implementation).
    this["_receiver"] = {}; // Object: receiver hash table. { id: receiver, ... }
}
Postal["name"] = "Postal";
Postal["repository"] = "https://github.com/uupaa/Postal.js";

Postal["prototype"] = {
    "constructor":  Postal,
    "id":           _id,        // Postal#id(receiver:ReceiverObject):ReceiverIDString
    "register":     register,   // Postal#register(receiver:ReceiverObject):this
    "unregister":   unregister, // Postal#unregister(receiver:ReceiverObject = undefined):this
    "to":           to,         // Postal#to(receiver:ReceiverObject = undefined):Envelope
    "omit":         omit,       // Postal#omit(receiver:ReceiverObject):Envelope
    "send":         send,       // Postal#send(message:String, param:Mix = undefined, ...):Object
    "post":         post        // Postal#post(message:String, param:Mix = undefined, ...):Object
};

function Envelope(hash,         // @arg receiverHashTableObject: registered receiver. { id: object, ... }
                  to) {         // @arg StringArray: delivery id. ["id", ...]
    this["_receiver"] = hash;   // Object: receiver hash table. { id: receiver, ... }
    this["_to"] = to;           // StringArray: ["id", ...]
}
Envelope["name"] = "Envelope";
Envelope["prototype"] = {
    "constructor":  Envelope,
    "to":           to,         // Envelope#to(receiver:ReceiverObject):Envelope
    "omit":         omit,       // Envelope#omit(receiver:ReceiverObject):Envelope
    "list":         list,       // Envelope#list():ReceiverIDStringArray
    "send":         send,       // Envelope#send(message:String, param:Mix = undefined, ...):Object
    "post":         post        // Envelope#post(message:String, param:Mix = undefined, ...):Object
};

// --- implement -------------------------------------------
function _id(receiver) { // @arg ReceiverObject: registered receiver
                         // @ret String: postal id.
                         // @help: Postal#id
                         // @desc: get postal id.
    return (receiver || "")["__POSTAL_ID__"] || "";
}

function _validateReceiver(receiver) {
    if (!receiver || typeof receiver["inbox"] !== "function") {
        throw new Error("Object has not inbox function.");
    }
}

function register(receiver) { // @arg ReceiverObject: class instance, object
                              // @ret this:
                              // @throw: Error("Object has not inbox function.")
                              // @help: Postal#register
                              // @desc: register the object for message delivery.
    _validateReceiver(receiver);

    var id = _id(receiver);

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

function unregister(receiver) { // @arg ReceiverObject(= undefined): registered receiver.
                                // @ret this:
                                // @help: Postal#unregister
                                // @desc: unregister a object.
    if (receiver === undefined) {
        this["_receiver"] = {}; // unregister all
    } else {
        _validateReceiver(receiver);

        var id = _id(receiver);

        if (id) {
            delete this["_receiver"][id];
        }
    }
    return this;
}

function to(receiver) { // @arg ReceiverObject(= undefined): delivery to receiver. undefined is all receiver.
                        // @ret Envelope:
                        // @throw: Error("Object has not inbox function.")
                        // @help: Postal#to, Envelope#to
                        // @desc: set delivery objects.
    var _to = this instanceof Postal ? [] : this["_to"]; // receiverIDStringArray: ["id", ...]

    if (receiver === undefined) { // to all
        _to = Object.keys(this["_receiver"]);
    } else { // to receiver
        _validateReceiver(receiver);

        if (_to.indexOf( _id(receiver) ) < 0) {
            _to.push( _id(receiver) );
        }
    }
    if (this instanceof Postal) {
        return new Envelope(this["_receiver"], _to);
    }
    this["_to"] = _to;
    return this; // Envelope
}

function omit(receiver) { // @arg ReceiverObject: omit receiver.
                          // @ret Envelope:
                          // @help: Postal#omit, Envelope#omit
                          // @desc: omit receiver.
    _validateReceiver(receiver);

    var _to = this instanceof Postal ? Object.keys(this["_receiver"]) : this["_to"];
    var pos = _to.indexOf( _id(receiver) );

    if (pos >= 0) {
        _to.splice(pos, 1);
    }
    if (this instanceof Postal) {
        return new Envelope(this["_receiver"], _to);
    }
    return this;
}

function list() { // @ret ReceiverIDStringArray: [id, ...]
                  // @desc: enum registered list.
                  // @help: Envelope#list
    return [].concat(this["_to"]); // clone
}

function send(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: { id: result:Mix/Error, ... }
                       // @help: Postal#send, Envelope#send
                       // @desc: send a message synchronously.
    if (!message || typeof message !== "string") {
        throw new TypeError("invalid Postal.send(message: " + message + ")");
    }

    var resultValues = {}; // { id: resultValue, ... }
    var args = Array.prototype.slice.call(arguments);
    var _to = this instanceof Postal ? Object.keys(this["_receiver"]) // Broadcast
                                     : this["_to"]; // Envelope._to

    for (var i = 0, iz = _to.length; i < iz; ++i) {
        var id = _to[i];
        var receiverObject = this["_receiver"][id];

        if (receiverObject) { // alive?
            resultValues[id] = receiverObject["inbox"].apply(receiverObject, args);
        }
    }
    return resultValues;
}

function post(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: {}
                       // @desc: post a message asynchronously.
                       // @help: Postal#post, Envelope#post
    if (!message || typeof message !== "string") {
        throw new TypeError("invalid Postal.post(message: " + message + ")");
    }

    var that = this;
    var args = Array.prototype.slice.call(arguments);
    var _to = this instanceof Postal ? Object.keys(this["_receiver"]) // Broadcast
                                     : this["_to"]; // Envelope._to

    setTimeout(function() {
        for (var i = 0, iz = _to.length; i < iz; ++i) {
            var id = _to[i];
            var receiverObject = that["_receiver"][id];

            if (receiverObject) { // alive?
                receiverObject["inbox"].apply(receiverObject, args);
            }
        }
    }, 0);
    return {};
}

//{@assert
function _if(booleanValue, errorMessageString) {
    if (booleanValue) {
        throw new Error(errorMessageString);
    }
}
//}@assert

// --- export ----------------------------------------------
//{@node
if (inNode) {
    module["exports"] = Postal;
}
//}@node
global["Postal"] ? (global["Postal_"] = Postal) // already exsists
                 : (global["Postal"]  = Postal);

})(this.self || global);

