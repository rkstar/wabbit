!function(e){function n(s){if(t[s])return t[s].exports;var u=t[s]={exports:{},id:s,loaded:!1};return e[s].call(u.exports,u,u.exports,n),u.loaded=!0,u.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){t(1),e.exports=t(1)},function(e,n,t){"use strict";function s(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}var u=function(){function e(e,n){for(var t=0;t<n.length;t++){var s=n[t];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(n,t,s){return t&&e(n.prototype,t),s&&e(n,s),n}}(),i=t(2),r=t(3),o=t(4).EventEmitter,a=new o,h="[WABBIT]",c=null,l=function(){function e(){return s(this,e),c=c||this}return u(e,[{key:"nackOnError",value:function(){i.nackOnError()}},{key:"configure",value:function(e){var n=this;return new Promise(function(t,s){i.configure(e).done(function(){n.debug&&console.log(h,"Rabbot configured.");var u=e.bindings;if(u&&u instanceof Array&&!(u.length<1))u.map(function(e){if(e.exchange){var t=new n.Exchange(e.exchange);if(e.target){var s=new n.Queue({name:e.target,keys:e.keys});t.registerQueue(s)}n.registerExchange(t)}}),a.on("register:exchange",n.runExchange),a.on("register:queue",n.runQueue),n.debug&&console.log(h,"Wabbit configured."),n.ready=!0,t();else{var i="Wabbit.configure must be passed an [Object]";n.debug&&console.warn(h,i),s(new Error(i))}})})}},{key:"dump",value:function(){r.values(this.exchanges).map(function(e){console.log(JSON.stringify(e,!0,2)),r.values(e.queues).map(function(e){console.log(JSON.stringify(e,!0,2))})})}},{key:"run",value:function(){var e=this;if(!this.ready){var n="Wabbit has not been configured! Please make sure you run Wabbit.configure() first.";throw this.debug&&console.warn(h,n),new Error(n)}this.debug&&console.log(h,"Running exchanges..."),r.values(this.exchanges).map(function(n){e.runExchange(n)}),this.debug&&r.isArray(this.messages)&&this.messages.length&&console.log(h,"Publishing stored messages.");for(var t=null;t=this.messages.shift();)"request"==t.type?this.request(t.key,t.msg):this.publish(t.key,t.msg)}},{key:"runExchange",value:function(e){var n=this;this.debug&&console.log(h,"Running queues..."),r.values(e.queues).map(function(t){n.runQueue(t,e)})}},{key:"runQueue",value:function(e,n){var t=this,s=r.isArray(e.handlers)&&e.handlers.length;if(s)e.handlers.map(function(s){if(s&&s.key&&s.handler){var u={key:s.key,exchange:n.name,queue:e.name};t.createRouteMap(u),i.handle({type:s.key,handler:function(e){s.handler(e,function(n){if(e.properties.headers.reply){var t=r.isUndefined(n)||r.isNull(n)?{result:null}:n;e.reply(t)}else e.ack()})}})["catch"](function(e,n){t.debug&&(console.log(h,e),console.log(h,n))})}}),this.debug&&console.log(h,"Starting subscription on:",e.name),i.startSubscription(e.name);else for(var u=void 0;u=e.keys.shift();){var o={key:u,exchange:n.name,queue:e.name};this.createRouteMap(o)}}},{key:"registerExchange",value:function(e){var n=this;return e?void(this.exchanges[e.name]?r.values(e.queues).map(function(t){n.exchanges[e.name].registerQueue(t)}):(this.exchanges[e.name]=e,a.emit("register:exchange",this.exchanges[e.name]))):null}},{key:"request",value:function(e,n){if(this.debug&&console.log(h,"requested:",e,n),!i)return console.warn("Queueing request for delivery when Rabbot is available."),void this.messages.push(Object.assign({},{type:"request"},{key:e,msg:n}));var t=this.routeMap[e];if(r.isNull(t)||r.isUndefined(t))return void(this.debug&&console.log(h,"no route mapped for:",e,t));var s=t.type,u=t.routingKey,o=t.exchange,a=(t.queue,Object.assign({},{routingKey:u,type:s,body:n,headers:{reply:!0},replyTimeout:2e3}));return this.debug&&console.log(h,"requesting w/options:",JSON.stringify(a,!0,2)),i.request(o,a)}},{key:"publish",value:function(e,n){if(this.debug&&console.log(h,"published:",e,n),!i)return console.warn("Queueing request for delivery when Rabbot is available."),void this.messages.push(Object.assign({},{type:"publish"},{key:e,msg:n}));var t=this.routeMap[e];if(r.isNull(t)||r.isUndefined(t))return void(this.debug&&console.log(h,"no route mapped for:",e,t));var s=t.type,u=t.routingKey,o=t.exchange,a=(t.queue,Object.assign({},{routingKey:u,type:s,body:n}));return this.debug&&console.log(h,"publishing w/options:",JSON.stringify(a,!0,2)),i.publish(o,a)}},{key:"createRouteMap",value:function(e){var n=e.key,t=e.queue,s=e.exchange;this.routeMap[n]={queue:t,exchange:s,routingKey:n,type:n}}},{key:"debug",get:function(){return this._debug||!1},set:function(e){this._debug=r.isBoolean(e)?e:e}},{key:"routeMap",get:function(){return this._routeMap||(this.routeMap={}),this._routeMap},set:function(e){this._routeMap=r.isObject(e)?e:{value:e}}},{key:"exchanges",get:function(){return this._exchanges||(this.exchanges={}),this._exchanges},set:function(e){this._exchanges=r.isObject(e)?e:{value:e}}},{key:"messages",get:function(){return this._messages||[]},set:function(e){this._messages=r.isArray(e)?e:[e]}},{key:"ready",get:function(){return this._ready||!1},set:function(e){this._ready=r.isBoolean(e)?e:e}},{key:"Exchange",get:function(){return function(){function e(n){s(this,e),this.name=n}return u(e,[{key:"registerQueue",value:function(e){if(!e)return null;if(this.queues[e.name]){var n=this.queues[e.name].keys.concat(e.keys);n.sort(),this.queues[e.name].keys=r.uniq(n,!0),Array.prototype.push.apply(this.queues[e.name].handlers,e.handlers)}else this.queues[e.name]=e,a.emit("register:queue",this.queues[e.name])}},{key:"getQueue",value:function(e){return this.queues[e]}},{key:"name",get:function(){return this._name},set:function(e){this._name=r.isString(e)?e:e.toString()}},{key:"queues",get:function(){return this._queues||(this.queues={}),this._queues},set:function(e){this._queues=r.isObject(e)?e:{value:e}}}]),e}()}},{key:"Queue",get:function(){return function(){function e(n){s(this,e),this.name=n.name,this.keys=n.keys}return u(e,[{key:"registerHandler",value:function(e){if(!e||!r.isObject(e))throw new Error(500,"Queue.handler options must be an [Object] with properties {key, handler}");var n=e.key,t=e.handler;if(!n||!this.hasKey(n))throw new Error(501,"Queue.handler routing key ["+n+"] is not available on this queue");if(!t||!r.isFunction(t))throw new Error(502,"Queue.handler handler function must be of type [Function]");this.handlers.push({key:n,handler:t})}},{key:"hasKey",value:function(e){return this.keys.indexOf(e)>-1}},{key:"name",get:function(){return this._name},set:function(e){this._name=r.isString(e)?e:e.toString()}},{key:"keys",get:function(){return this._keys||(this.keys=[]),this._keys},set:function(e){this._keys=r.isArray(e)?e:[e]}},{key:"handlers",get:function(){return this._handlers||(this.handlers=[]),this._handlers},set:function(e){this._handlers=r.isArray(e)?e:[e]}}]),e}()}}]),e}(),g=new l;e.exports=g},function(e,n){e.exports=require("rabbot")},function(e,n){e.exports=require("lodash")},function(e,n){e.exports=require("events")}]);
//# sourceMappingURL=build.js.map