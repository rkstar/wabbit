const Wascally = require('wascally'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  ee = new EventEmitter(),
  prefix = '[WABBIT]'

let instance = null

class Wabbit {
  constructor(){
    instance = instance || this
    return instance
  }

  nackOnError(){
    Wascally.nackOnError()
  }

  get debug(){
    return this._debug || false
  }
  set debug(value){
    this._debug = _.isBoolean(value) ? value : (value)
  }

  configure(config){
    // NOTE
    // we will return a promise that will resolve
    // after we have fully configured Wascally AND Wabbit
    // and registered all of the queues and exchanges
    return new Promise((resolve, reject)=>{
      Wascally.configure(config)
        .done(()=>{
          if( this.debug ){
            console.log(prefix, "Wascally configured.")
          }

          const {bindings} = config
          if( !bindings || !(bindings instanceof Array) || (bindings.length < 1) ){
            const err = "Wabbit.configure must be passed an [Object]"
            if( this.debug ){
              console.warn(prefix, err)
            }
            reject(new Error(err))
          } else {
            bindings.map((config)=>{
              if( config.exchange ){
                let ex = new this.Exchange(config.exchange)
                if( config.target ){
                  let q = new this.Queue({
                    name: config.target,
                    keys: config.keys
                  })
                  ex.registerQueue(q)
                }
                this.registerExchange(ex)
              }
            })
            // now set up our listener just in case any more exchanges
            // get added after this point
            ee.on('register:exchange', this.runExchange)
            ee.on('register:queue', this.runQueue)
            if( this.debug ){
              console.log(prefix, "Wabbit configured.")
            }
            this.ready = true
            resolve()
          }
        })
    })
  }

  dump(){
    _.values(this.exchanges).map((exchange)=>{
      console.log(exchange)
      _.values(exchange.queues).map((queue)=>{
        console.log(queue)
      })
    })
  }

  run(){
    if( !this.ready ){
      const err = 'Wabbit has not been configured! Please make sure you run Wabbit.configure() first.'
      if( this.debug ){
        console.warn(prefix, err)
      }
      throw new Error(err)
    }
    // ensure that all queues handlers are registered with rabbitmq!
    // map all queues
    if( this.debug ){
      console.log(prefix, "Running exchanges...")
    }
    _.values(this.exchanges).map((exchange)=>{
      this.runExchange(exchange)
    })

    // everything is registered (trickle-down...)
    // try to empty our messages in memory this.messages
    if( this.debug ){
      console.log(prefix, "Publishing stored messages.")
    }
    let msg = null
    while( msg = this.messages.shift() ){
      if( msg.type == 'request' ){
        this.request(msg.key, msg.msg)
      } else {
        this.publish(msg.key, msg.msg)
      }
    }
  }

  runExchange(exchange){
    if( this.debug ){
      console.log(prefix, 'Running queues...')
    }
    _.values(exchange.queues).map((queue)=>{
      this.runQueue(queue, exchange)
    })
  }

  runQueue(queue, exchange){
    if( !_.isArray(queue.handlers) || !queue.handlers.length ){
      return
    }

    queue.handlers.map((handler)=>{
      if( !handler || !handler.key || !handler.handler ){
        return
      }
      this.routeMap[handler.key] = {
        routingKey: handler.key,
        type: handler.key,
        exchange: exchange.name,
        queue: queue.name
      }

      Wascally.handle(handler.key, (msg)=>{
        handler.handler(msg, (result)=>{
          if( msg.properties.headers.reply ){
            msg.reply(result)
          } else {
            msg.ack()
          }
        })
      })
    })
    // all handlers have been initialized for this queue
    // we can safely start the subscription
    if( this.debug ){
      console.log(prefix, 'Starting subscription on:', queue.name)
    }
    Wascally.startSubscription(queue.name)
  }

  registerExchange(exchange){
    if( !exchange ){
      return null
    }

    if( this.exchanges[exchange.name] ){
      // we have already registered this exchange...
      // let's do ourselves a solid and register
      // any queues that are registered to this incoming exchange
      _.values(exchange.queues).map((queue)=>{
        this.exchanges[exchange.name].registerQueue(queue)
      })
    } else {
      this.exchanges[exchange.name] = exchange
      ee.emit('register:exchange', this.exchanges[exchange.name])
    }
  }

  request(key, msg){
    if( !Wascally ){
      console.warn('Queueing request for delivery when Wascally is available.')
      this.messages.push(Object.assign({}, {type:'request'}, {key, msg}))
      return
    }

    const map = this.routeMap[key]
    return Wascally.request(map.exchange, Object.assign({},{
      body: msg,
      headers: {reply:true}
    }, _.pick(map, ['routingKey','type'])))
  }

  publish(key, msg){
    if( !Wascally ){
      console.warn('Queueing request for delivery when Wascally is available.')
      this.messages.push(Object.assign({}, {type:'publish'}, {key, msg}))
      return
    }

    const map = this.routeMap[key]
    return Wascally.publish(map.exchange, Object.assign({},{
      body: msg,
      headers: {reply:false}
    }, _.pick(map, ['routingKey','type'])))
  }

  get routeMap(){
    if( !this._routeMap ){
      this.routeMap = {}
    }
    return this._routeMap
  }
  set routeMap(value){
    this._routeMap = _.isObject(value) ? value : {value}
  }

  get exchanges(){
    if( !this._exchanges ){
      this.exchanges = {}
    }
    return this._exchanges
  }
  set exchanges(value){
    this._exchanges = _.isObject(value) ? value : {value}
  }

  get messages(){
    return this._messages || []
  }
  set messages(value){
    this._messages = _.isArray(value) ? value : [value]
  }

  get ready(){
    return this._ready || false
  }
  set ready(value){
    this._ready = _.isBoolean(value) ? value : (value)
  }

  ///////////////////////////////////////////
  //
  // a class within a class!
  //
  get Exchange(){
    return class {
      constructor(name){
        this.name = name
      }

      registerQueue(queue){
        if( !queue ){
          return null
        }

        // we have already registered this queue...
        // let's do ourselves a solid and add any
        // routing keys and handlers that are listed in the incoming queue
        if( this.queues[queue.name] ){
          // keys
          let keys = this.queues[queue.name].keys.concat(queue.keys)
          keys.sort()
          this.queues[queue.name].keys = _.uniq(keys, true)
          // handlers
          Array.prototype.push.apply(this.queues[queue.name].handlers, queue.handlers)
        } else {
          this.queues[queue.name] = queue
          ee.emit('register:queue', this.queues[queue.name])
        }
      }

      getQueue(name){
        return this.queues[name]
      }

      get name(){
        return this._name
      }
      set name(value){
        this._name = _.isString(value) ? value : value.toString()
      }

      get queues(){
        if( !this._queues ){
          this.queues = {}
        }
        return this._queues
      }
      set queues(value){
        this._queues = _.isObject(value) ? value : {value}
      }
    }
  }

  ///////////////////////////////////////////
  //
  // a class within a class!
  //
  get Queue(){
    return class {
      constructor(opts){
        this.name = opts.name
        this.keys = opts.keys
      }

      registerHandler(opts){
        if( !opts || !_.isObject(opts) ){
          throw new Error(500, `Queue.handler options must be an [Object] with properties {key, handler}`)
        }

        const {key, handler} = opts
        if( !key || !this.hasKey(key) ){
          throw new Error(501, `Queue.handler routing key [${key}] is not available on this queue`)
        }
        if( !handler || !_.isFunction(handler) ){
          throw new Error(502, `Queue.handler handler function must be of type [Function]`)
        }

        this.handlers.push({key, handler})
      }

      get name(){
        return this._name
      }
      set name(value){
        this._name = _.isString(value) ? value : value.toString()
      }

      get keys(){
        if( !this._keys ){
          this.keys = []
        }
        return this._keys
      }
      set keys(value){
        this._keys = _.isArray(value) ? value : [value]
      }

      hasKey(key){
        return (this.keys.indexOf(key) > -1)
      }

      get handlers(){
        if( !this._handlers ){
          this.handlers = []
        }
        return this._handlers
      }
      set handlers(value){
        this._handlers = _.isArray(value) ? value : [value]
      }
    }
  }
}

module.exports = new Wabbit()