/**
 * @author Nabil Redmann (BananaAcid)
 * @url    banaacid.de/
 */

"use strict";


module.exports = function(Vantage, options) 
{
	const version = require('../package.json').version;

	const Util = require('util')
	    , vm = require('vm');
	var jsCtx = {}
	  , newOptions = []
	  , cardinal = null; try { cardinal = require('cardinal'); } catch (e) {};

	if (typeof(options.context) !== 'object')
		throw 'missing options.context={..} in Vantage.use()';


	var VantageProxy = {
		command: function(cmd, desc)
		{ newOptions.push(cmd); return Vantage.command(cmd, desc); },
		mode: function(cmd, desc) { newOptions.push(cmd); return Vantage.mode(cmd, desc); },
		logNewCmds: function(Vantage_log) {Vantage_log( 'Commands:\n' + newOptions.map(function(i,e){ return ' - ' + i + '\n' }).join('') );}
	};


	VantageProxy
		.command('version js', 'JS REPL version ' + version)
		.action(function(cmd,cb) {
			var Vantage_log = this.log.bind(this);

			Vantage_log(
				'Author' + '\n'
				+' * Nabil Redmann (BananaAcid)' + '\n'
				+' * bananaacid.de' + '\n'
				+'INFO' + '\n'
				+' * regenerates the context each run / REPL start ' + '\n'
				+' * provides a sandbox with newly created context basics (see initCtx, allows these functions to be overwritten within sandbox) ' + '\n'
				+' * only options.context provided objects are really linked into the app ' + '\n'
				+' * sports developer console inspection (just type an object an press enter) ' + '\n'
				+' * sports developer console syntax error output with position cursor ' + '\n'
				+' * console.log/info/warn/error are also piped to a remote connection and do net mess up the prompt ' + '\n'
				+' * remote vantage connections do get the results there ' + '\n'
				+' * KNOWN: only single line statements are computed. ' + '\n'
			);
			VantageProxy.logNewCmds(Vantage_log);
			cb();
		});


	VantageProxy
		.mode('js')
		.delimiter('js>')
		.description('Starts a JS REPL.')
		.init(function(args, cb) {
			var Vantage_log = this.log.bind(this);

			var initCtx = {
				cbInfo:  function(caption) { return function() {Vantage_log((caption||'') + ' ' + Util.inspect(Array.prototype.slice.call(arguments), {showHidden: true, colors: true}) ); }; },
				cbError: function(caption) { return function() {Vantage_log((caption||'') + ' ' + Util.inspect(Array.prototype.slice.call(arguments), {showHidden: true, colors: true}) ); }; },
				fnInfo:  function() { Vantage_log( Util.inspect(Array.prototype.slice.call(arguments), {showHidden: true, colors: true}) ); },
				fnError: function() { Vantage_log( Util.inspect(Array.prototype.slice.call(arguments), {showHidden: true, colors: true}) ); },

				// Unfortunately, Vantage has no support for console.error and the others. (so no errorpipe or color coding)
				console: Util._extend({}, {log: Vantage_log, info: Vantage_log, warn: Vantage_log, error: Vantage_log}),

				// define how many levels the default console inspection will expand object properties
				utilInspectDepth: 0
			}
			var sandbox = Util._extend(initCtx, options.context)
			  , fnParamStr = function(fn) { var f = fn.toString(); return f.slice(f.indexOf('(') + 1, f.indexOf(')')).match(/([^\s,]+)/g); }
			  , objs = Object.keys(sandbox).map(function(k) { var t = typeof(sandbox[k]); return (k + ':' + t) + (t == 'function' ? '('+(fnParamStr(sandbox[k])||[]).join(',') +')' : '');}).join(', ');

			Vantage_log(' In REPL you can execute JS statements.\n'
						+' * NodeJS module "Util" is loaded.\n'
						+' * Set a new value on utilInspectDepth to increase inspection depth.\n'
						+' *  -> utilInspectDepth=2;\n'
						+' * You can use generic return functions to output any passed arguments (cbInfo/cbError, fnInfo/fnError)\n'
						+' *  -> doSomething.success(cbInfo(\'success with:\')).fail(cbError(\'failed with:\'));\n'
						+' *  -> doSomething.success(fnInfo).fail(fnError);\n'
						+' *  -> mongo.db.users.find({}).exec(fnInfo);\n'
						+' * Available objects:\n'
						+' *  -> ' + objs + '\n'
						+' **|Use "exit" or ".." to close the REPL. Use "..-" to exit completely. (does not work remotely)'
						);
			
			// destroy sandbox local context, but attach objects (modifiable)
			jsCtx = vm.createContext(sandbox);
			cb();
		})
		.action(function(command, cb) {
			var Vantage_log = this.log.bind(this);

			if (command == '..')
				return Vantage.exec('exit');
			else if (command == '..-')
				return Vantage.exec('exit').then(function(){return Vantage.exec('exit --force')});

			try {
				var ret = vm.runInContext(command, jsCtx);
				if (ret !== undefined) {
					if (typeof(ret) === 'function')
						if (cardinal)
							Vantage_log(cardinal.highlight(ret, {json: true, linenos: true}));
						else
							Vantage_log(ret.toString());

					Vantage_log(Util.inspect(ret, {showHidden: true, colors: true, depth: jsCtx.utilInspectDepth}));
				}
			}
			catch (e) {Vantage_log(e);}

			cb()
		});

};