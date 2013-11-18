Postal.js
=========

Postal.js is message delivery utility.

Postal はメッセージの送信により、オブジェクトを疎結合にする仕組みを提供します。  
同様の仕組みは Observer パターンと呼ばれています。

# Install, Setup modules

```sh
$ git clone git@github.com:uupaa/postal.js.git
$ cd postal.js
$ npm install

    npm http GET https://registry.npmjs.org/uupaa.task.js
    npm http 200 https://registry.npmjs.org/uupaa.task.js
    uupaa.task.js@0.8.0 node_modules/uupaa.task.js
```

# Test

```sh
$ npm test

    > uupaa.postal.js@0.8.0 test /Users/username/path/postal.js
    > NODE_ENV=production NODE_PATH=lib node --harmony test/index.node.js; open test/index.html

    testPostableObject ok
    testTo ok
    testOmit ok
    testAssert ok
    testUnregister ng
    testReuseEnvelope ok
    test success.
    ok.
```

# 密結合と疎結合
システムを構成する部品同士が複雑に絡み合い、固着した状態を **密結合** と呼びます。  
反対に、各部品が互いの存在をそれほど意識せず、フレキシブルに機能する状態を **疎結合** と呼びます。

## 密結合なシステムから疎結合なシステムへ

密結合のシステムを図式すると、  
3〜4個の中心的なオブジェクトから周囲のオブジェクトに、多くの交差する線が引かれてしまいます。  
このようなシステムは時間と共に線が増え、メンテナンスも難しくなります。

メソッドを直接呼び出している部分をメッセージの送信に置き換え、  
オブジェクトが互いの存在を強く意識せずに済む状態にできれば、  
システムをフレキシブルで、部品の入れ替えが可能な状態に維持できます。

## 郵便配達の流れを模倣したAPIセット

Postal のメッセージを配達する流れは、実際の郵便配達の流れと一緒です。

1. 郵便局に受取人の住所を登録します
2. 宛先が書かれた封筒を用意します
3. 封筒にメッセージを入れて投函します
4. 宛先にメッセージが届きます

これを Postal で実装すると、以下のようになります。

```js
// メッセージを受け取るオブジェクト( receiver )を用意します。
var receiver = {
        inbox: function(message, param1, param2) {
            console.log("message: " + message); // 4. 宛先にメッセージが届きます
            return "world";
        }
    };

var postal = new Postal();                  // 郵便局(Postal)を作成します
postal.register(receiver);                  // 1. 郵便局(Postal)に受取人(receiver)を登録します

var envelope = postal.to(receiver);         // 2. 宛先が書かれた封筒(Envelope)を用意します
var resultObject = envelope.send("hello");  // 3. 封筒にメッセージ("hello")を入れて投函(send)します
```

resultObject は、receiver.inbox() の実行結果が格納されたオブジェクトです、  
resultObject からメッセージの送信結果を取得できます。

```js
var receiverID = postal.id(receiver);       // receiver の ID を取得する

resultValue = resultObject[receiverID];     // ID で戻り値を検索
console.log( resultValue );                 // -> "world"
```

## Postal のメリットとデメリット

Postal のメリットは以下になります。

- メッセージを使ったゆるい規約に基づいてシステムを拡張できる
- 相手の状態をあまり意識せず、とりあえずメッセージを投げられる
- 同期, 非同期でメッセージを簡単に投げられる
    - 同期メッセージなら戻り値も得られる
- メッセージと共に可変長の引数を渡せる

デメリットは特にありません。

----
# Postal API

Postal の API について説明します。

## Postal#register
## Postal#unregister

メッセージを受信するレシーバーオブジェクトを、register(receiver) で登録します。  
抹消は unregister(receiver) で行います。引数を省略し unregister() とすると、登録済みの全ての receiver を抹消します。

```
function register(receiver) { // @arg ReceiverObject:
                              // @ret this:
                              // @throw: Error("Object has not inbox function.")
                              // @desc: register the object for message delivery.
}
function unregister(receiver) { // @arg ReceiverObject(= undefined): registered receiver.
                                // @ret this:
                                // @desc: unregister a object.
}
```

```js
var receiverObject = {
        inbox: function(message) { // message -> "Hello"
            return true;
        }
    };

var postal = new Postal();

postal.register(receiverObject);
postal.to().send("Hello");
postal.unregister(); // unregister all
```

Postal#register() で登録できるオブジェクト(ReceiverObject)は、inbox メソッドを持っている必要があります。

```js
function ReceiverClass() { }
ReceiverClass.prototype.inbox = function(message) {};

var receiverObject = {
        inbox: function(message) {}
    };

var postal = new Postal();
postal.register( new ReceiverClass() ); // 登録できます。
postal.register( receiverObject );      // 登録できます。
postal.register( {} );                  // 登録できません(エラーになります)。
```

## Postal#to
## Postal#omit

Postal#to と Postal#omit は 封筒(Envelope)オブジェクトを生成します。

to と omit を組み合わせて Envelope に宛先を設定していきます。

```sh
var foo = { inbox: function() {} };
var bar = { inbox: function() {} };
var buz = { inbox: function() {} };
var postal = new Postal();

postal.register(foo).register(bar).register(buz);
```

上記の状態で、

- postal.to() は `foo, bar, buz` を宛先に設定します。登録済みの receiver にブロードキャスト(一斉通知)できます
- postal.to(foo) は `foo` を宛先に設定します
- postal.to(foo).to(bar) は `foo, bar` を宛先に設定します
- postal.to(foo).to(bar).to(buz) は to() と一緒です
- postal.to().to(foo) は to() と一緒です。`foo` が二重に宛先に登録される事はありません

- postal.omit(foo) は postal.to().omit(foo) と同じです。`foo` が除外され、`bar, buz` を宛先に設定します
- postal.omit(foo).omit(bar) は `foo, bar` が除外され、`buz` を宛先に設定します
- postal.to(foo).omit(foo) は宛先が空になります

といった動作をします。

```
function to(receiver) { // @arg(= undefined): delivery to receiver. undefined is all receiver.
                        // @ret Envelope:
                        // @throw: Error("Object has not inbox function.")
                        // @desc: set delivery objects.
}
function omit(receiver) { // @arg: omit receiver.
                          // @ret Envelope:
                          // @desc: omit receiver.
}
```

```js
function Foo() { }
Foo.prototype.inbox = function(msg, arg1, arg2) {
    console.log("Foo#inbox", arg1, arg2);
    return true;
};

function Bar() { }
Bar.prototype.inbox = function(msg, arg1, arg2) {
    console.log("Bar#inbox", arg1, arg2);
    return true;
};

function Buz() { }
Buz.prototype.inbox = function(msg, arg1, arg2) {
    console.log("Buz#inbox", arg1, arg2);
    return true;
};

var foo = new Foo();
var bar = new Bar();
var buz = new Bar();
var postal = new Postal();

postal.register(foo).register(bar).register(buz);

postal.to().send("hello");              // foo, bar, buz にメッセージが届きます
postal.to(foo).to(bar).send("hello");   // foo, bar にメッセージが届きます
postal.omit(bar).send("hello");         // foo, buz にメッセージが届きます
postal.to().omit(bar).send("hello");    // foo, buz にメッセージが届きます
postal.to(bar).omit(bar).send("hello"); // どこにもメッセージは届きません
```

## Envelope#send
## Envelope#post
## Postal#id

メッセージの送信は、  
Envelope#send(message:String, param:Mix...):Object または  
Envelope#post(message:String, param:Mix...):Object で行います。

```js
function send(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: { id: result:Mix/Error, ... }
                       // @desc: send a message synchronously.
}
function post(message, // @arg String: message
              ooo) {   // @var_args Mix: inbox params. inbox(message, param, ...)
                       // @ret Object: {}
                       // @desc: post a message asynchronously.
}
```

send は同期送信で、post は非同期送信です。  
Envelope に複数の宛先が設定されている場合は、順番にメッセージを送信します。

- send と post には複数のパラメタを渡す事ができます。
    - パラメタは、inbox(message, param...) の形で渡されます。
- send はinboxの実行結果を返します。
- post はinboxの実行結果を返しません。常に`{}`を返します。

Envelope#send() の戻り値から receiver 毎の戻り値を求めるには Postal#id() を使います。

```js
var foo = {
        inbox: function(message, param1, param2) {
            return param1 + param2;
        }
    };
var bar = {
        inbox: function(message, param1, param2) {
            return param1 * param2;
        }
    };

var postal = new Postal().register(foo).register(bar);
var envelope = postal.to();

// foo.inbox と bar.inbox にメッセージ"calc"を送信します。
// resultObject に戻り値が格納されます。
//      foo.inbox("calc", 2, 4) -> 6 (2+4)
//      bar.inbox("calc", 2, 4) -> 8 (2*4)
var resultObject = envelope.send("calc", 2, 4);

console.log( resultObject[ postal.id(foo) ] ); // -> 6
console.log( resultObject[ postal.id(bar) ] ); // -> 8
```

## Postal#send
## Postal#post

Postal#send() は、postal.to().send() のショートカットです。全ての receiverObject にメッセージを配信します。  
Postal#post() も同様に postal.to().post() のショートカットです。

```js
var postal = new Postal().register(foo).register(bar);

postal.send("hello"); // foo.inbox("hello"), bar.inbox("hello") を呼び出します
postal.post("hello"); // foo.inbox("hello"), bar.inbox("hello") を呼び出します
```

