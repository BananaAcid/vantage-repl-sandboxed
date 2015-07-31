# vantage-repl-sandboxed
Advanced REPL extension for vantage.js

  * regenerates the context each run / REPL start
  * provides a sandbox with newly created context basics (see initCtx, allows these functions to be overwritten within sandbox)
  * only options.context provided objects are really linked into the app
  * sports developer console inspection (just type an object, function name, whatever an press enter)
  * sports developer console syntax error output with position cursor
  * validates and makes the position of the faulty javascript statement
  * console.log/info/warn/error are also piped to a remote connection and do net mess up the prompt
  * functions get highlighted if all optional dependencies are installed
  * remote vantage connections do get the results there (v1.0.1)
  * KNOWN: only single line statements are computed.

Bugs:
  * '..' and '..-' execute on the main server instance. Ventage.exec does not execute in the remote shell, and there is no this.exec (nothing i can do about)


##### Installation

```bash
npm install vantage-repl-sandboxed
npm install vantage
```

##### Programmatic use

```js
// index.js
var Vantage = require('vantage')
  , repl = require('vantage-repl-sandboxed')
  ;

var vantage = Vantage();

vantage
  .delimiter('node~$')
  .use(repl, {context:{koa: app, mongo: mongo, socketio: socket, vantage: vantage}})
  .show();
```

```bash
$ node app.js
node~$ 
node~$ js
 (Banner is shown, presented below ..)
node~$ js>
node~$ js> 6 * 6
32
node~$ js> vantage
{ _version: '',
  commands: [Object],
  _queue: [Object],
  _command: undefined,
  ui: [Object],
  _delimiter: 'node~$',
  _banner: ' ... ',
  client: [Object],
  server: [Object],
  _hooked: false,
  util: [Object],
  _authFn: [Object],
  session: [Object],
  executables: true,
  firewall: [Object],
  _histCache: undefined,
  _histCtrCache: NaN,
  _hist: [Object],
  _histCtr: 0 }
node~$ js> 
node~$ js> console.log('test')
test
node~$ js> ..
node~$
```

##### What it does

it adds a version group command, that all modules may use to add their version
```
node~$ version

  Commands:

    version js          JS REPL version 1.0.1

```

You may open the help to see its details, and possible commands
```
node~$ version js
Author
 * Nabil Redmann (BananaAcid)
 * bananaacid.de
INFO
 * regenerates the context each run REPL start
 * provides a sandbox with newly created context basics (see initCtx, allows these functions to be overwritten within sandbox)
 * only options.context provided objects are really linked into the app
 * sports developer console inspection (just type an object an press enter)
 * sports developer console syntax error output with position cursor
 * console.log/info/warn/error are also piped to a remote connection and do net mess up the prompt
 * KNOWN: only single line statements are computed.

Commands:
 - version js
 - js
 ```

The banner shown above, when entering the REPL
```
node~$ js
 In REPL you can execute JS statements.
 * NodeJS module "Util" is loaded.
 * Set a new value on utilInspectDepth to increase inspection depth.
 *  -> utilInspectDepth=2;
 * You can use generic return functions to output any passed arguments (cbInfo/cbError, fnInfo/fnError)
 *  -> doSomething.success(cbInfo('success with:')).fail(cbError('failed with:'));
 *  -> doSomething.success(fnInfo).fail(fnError);
 *  -> mongo.db.users.find({}).exec(fnInfo);
 * Available objects:
 *  -> cbInfo:function(caption), cbError:function(caption), fnInfo:function(), fnError:function(), console:object,utilInspectDepth:number, koa:object, mongo:object, socketio:object, vantage:object
 **|Use "exit" or ".." to close the REPL. Use "..-" to exit completely.
```