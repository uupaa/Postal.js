// @name: Postal.js
// @dscription: Message delivery utility (Observer pattern implementation).
// @repository: https://github.com/uupaa/Postal.js.git

(function(global) {

// --- define ----------------------------------------------
// --- variable --------------------------------------------
var _counter = 0;           // Integer: PostalID Counter.

// --- interface -------------------------------------------
function Postal() {
    this._receiverMap = {}; // Object: receiver map. { id: receiver, ... }
}
Postal.name = "Postal";
Postal.prototype = {
    constructor:Postal,
    id:         getID,      // Postal#id(receiver:ReceiverObject):ReceiverIDString
    register:   register,   // Postal#register(receiver:ReceiverObject):this
    unregister: unregister, // Postal#unregister(receiver:ReceiverObject = undefined...):this
    to:         to,         // Postal#to(receiver:ReceiverObject = undefined):Envelope
    omit:       omit,       // Postal#omit(receiver:ReceiverObject):Envelope
    send:       send,       // Postal#send(message:String, param:Mix = undefined, ...):Object
    post:       post        // Postal#post(message:String, param:Mix = undefined, ...):Object
};

function Envelope(map,      // @arg receiverMapObject: registered receiver. { id: object, ... }
                  to) {     // @arg StringArray: delivery id. ["id", ...]
    this._receiverMap = map;// Object: { id: receiver, ... }
    this._to = to;          // StringArray: ["id", ...]
}
Envelope.name = "Envelope";
Envelope.prototype = {
    constructor:Envelope,
    to:         to,         // Envelope#to(receiver:ReceiverObject):Envelope
    omit:       omit,       // Envelope#omit(receiver:ReceiverObject):Envelope
    list:       list,       // Envelope#list():ReceiverIDStringArray
    send:       send,       // Envelope#send(message:String, param:Mix = undefined, ...):Object
    post:       post        // Envelope#post(message:String, param:Mix = undefined, ...):Object
};

// --- implement -------------------------------------------
function getID(receiver) { // @arg ReceiverObject: registered receiver
                           // @ret String: "" is not registered
                           // @desc: get postal id.
    return (receiver || "").__POSTAL_ID__ || "";
}

function _validate(receiver) {
//{@assert
    _if(!receiver || typeof receiver.inbox !== "function", "Object has not inbox function.");
//}@assert
}

function register(receiver) { // @arg ReceiverObject:
                              // @ret this:
                              // @throw: Error("Object has not inbox function.")
                              // @desc: register the object for message delivery.
    _validate(receiver);
    if ( !getID(receiver) ) {
        var id = (++_counter).toString();

        if (Object.defineProperty) { // ES5 ready
            Object.defineProperty(receiver, "__POSTAL_ID__", { value: id }); // hidden and shield
        } else { // legacy
            receiver.__POSTAL_ID__ = id;
        }
        this._receiverMap[id] = receiver;
    }
    return this;
}

function unregister(receiver) { // @arg ReceiverObject(= undefined): registered receiver.
                                // @ret this:
                                // @desc: unregister a object.
    if (!arguments.length) {
        this._receiverMap = {}; // unregister all
    } else {
        _validate(receiver);
        delete this._receiverMap[ getID(receiver || {}) ];
    }
    return this;
}

function to(receiver) { // @arg(= undefined): delivery to receiver. undefined is all receiver.
                        // @ret Envelope:
                        // @throw: Error("Object has not inbox function.")
                        // @desc: set delivery objects.
    var _to = this instanceof Postal ? [] : this._to; // receiverIDStringArray: ["id", ...]

    if (!arguments.length) { // to all
        _to = Object.keys(this._receiverMap);
    } else { // to receiver
        _validate(receiver);
        if (_to.indexOf( getID(receiver) ) < 0) {
            _to.push( getID(receiver) );
        }
    }
    if (this instanceof Postal) {
        return new Envelope(this._receiverMap, _to);
    }
    this._to = _to;
    return this; // Envelope
}

function omit(receiver) { // @arg: omit receiver.
                          // @ret Envelope:
                          // @desc: omit receiver.
    _validate(receiver);
    var _to = this instanceof Postal ? Object.keys(this._receiverMap) : this._to;
    var pos = _to.indexOf( getID(receiver) );

    if (pos >= 0) {
        _to.splice(pos, 1);
    }
    if (this instanceof Postal) {
        return new Envelope(this._receiverMap, _to);
    }
    return this;
}

function list() { // @ret ReceiverIDStringArray: [id, ...]
                  // @desc: enum registered list.
    return [].concat(this._to); // clone
}

function send(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: { id: result:Mix/Error, ... }
                       // @desc: send a message synchronously.
//{@asssert
    _if(typeof message !== "string", "invalid message: " + message);
//}@asssert

    var resultValues = {}; // { id: resultValue, ... }
    var args = Array.prototype.slice.call(arguments);
    var _to = this instanceof Postal ? Object.keys(this._receiverMap) // Broadcast
                                     : this._to; // Envelope._to


    for (var i = 0, iz = _to.length; i < iz; ++i) {
        var id = _to[i];
        var receiverObject = this._receiverMap[id];

        if (receiverObject) { // alive?
            resultValues[id] = receiverObject.inbox.apply(receiverObject, args);
        }
    }
    return resultValues;
}

function post(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: {}
                       // @desc: post a message asynchronously.
//{@asssert
    _if(typeof message !== "string", "invalid message: " + message);
//}@asssert

    var that = this;
    var args = Array.prototype.slice.call(arguments);
    var _to = this instanceof Postal ? Object.keys(this._receiverMap) // Broadcast
                                     : this._to; // Envelope._to

    setTimeout(function() {
        for (var i = 0, iz = _to.length; i < iz; ++i) {
            var id = _to[i];
            var receiverObject = that._receiverMap[id];

            if (receiverObject) { // alive?
                receiverObject.inbox.apply(receiverObject, args);
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
if (global.process) { // node.js
    module.exports = Postal;
}
global.Postal = Postal;

})(this.self || global);

