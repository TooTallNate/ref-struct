
/**
 * An interface for modeling and instantiating C-style data structures. This is
 * not a constructor per-say, but a constructor generator. It takes an array of
 * tuples, the left side being the type, and the right side being a field name.
 * The order should be the same order it would appear in the C-style struct
 * definition. It returns a function that can be used to construct an object that
 * reads and writes to the data structure using properties specified by the
 * initial field list.
 *
 * The only verboten field names are "ref", which is used used on struct
 * instances as a function to retrieve the backing Buffer instance of the
 * struct, and "_pointer" which contains the backing Buffer instance.
 *
 *
 * Example:
 *
 * ``` javascript
 * var ref = require('ref')
 * var Struct = require('ref-struct')
 *
 * // create the `char *` type
 * var charPtr = ref.refType(ref.types.char)
 * var int = ref.types.int
 *
 * // create the struct "type" / constructor
 * var PasswordEntry = Struct({
 *     'username': charPtr
 *   , 'password': charPtr
 *   , 'salt':     int
 * })
 *
 * // create an instance of the struct, backed a Buffer instance
 * var pwd = new PasswordEntry()
 * pwd.username = ref.allocCString('ricky')
 * pwd.password = ref.allocCString('rbransonlovesnode.js')
 * pwd.salt = (Math.random() * 1000000) | 0
 *
 * pwd.username.readCString() // → 'ricky'
 * pwd.password.readCString() // → 'rbransonlovesnode.js'
 * pwd.salt                   // → 820088
 * ```
 */

var ref = require('ref')
var assert = require('assert')
var debug = require('debug')('ref:struct')


/**
 * The Struct "type" meta-constructor.
 */

function Struct () {
  debug('defining new struct "type"')

  /**
   * This is the "constructor" of the Struct type that gets returned.
   *
   * Invoke it with `new` to create a new Buffer instance backing the struct.
   * Pass it an existing Buffer instance to use that as the backing buffer.
   * Pass in an Object containing the struct fields to auto-populate the
   * struct with the data.
   */

  var constructor = function StructType (arg, data) {
    if (!(this instanceof constructor)) {
      return new constructor(arg, data)
    }
    debug('creating new struct instance')
    var store
    if (Buffer.isBuffer(arg)) {
      debug('using passed-in Buffer instance to back the struct', arg)
      assert(arg.length >= constructor.size, 'Buffer instance must be at least '
          + constructor.size + ' bytes to back this struct type')
      store = arg
      arg = data
    } else {
      debug('creating new Buffer instance to back the struct (size: %d)', constructor.size)
      store = new Buffer(constructor.size)
    }

    // set the backing Buffer store
    store.type = constructor
    this._pointer = store

    if (arg) {
      for (var key in arg) {
        // hopefully hit the struct setters
        this[key] = arg[key]
      }
    }
    constructor._instanceCreated = true
  }

  // make instances inherit from the `proto`
  constructor.prototype = Object.create(proto)
  constructor.prototype.constructor = constructor

  constructor.defineProperty = defineProperty
  constructor.toString = toString
  constructor.fields = {}

  // Setup the ref "type" interface. The constructor doubles as the "type" object
  constructor.size = 0
  constructor.alignment = 0
  constructor.indirection = 1
  constructor.get = get
  constructor.set = set

  // Read the fields list and apply all the fields to the struct
  // TODO: Better arg handling... (maybe look at ES6 binary data API?)
  var arg = arguments[0]
  if (Array.isArray(arg)) {
    // legacy API
    arg.forEach(function (a) {
      var type = a[0]
      var name = a[1]
      constructor.defineProperty(name, type)
    })
  } else if (typeof arg === 'object') {
    Object.keys(arg).forEach(function (name) {
      var type = arg[name]
      constructor.defineProperty(name, type)
    })
  }

  return constructor
}
module.exports = Struct

/**
 * The "get" function of the Struct "type" interface
 */

function get (buffer, offset) {
  debug('Struct "type" getter for buffer at offset', buffer, offset)
  if (offset > 0) {
    buffer = buffer.slice(offset)
  }
  return new this(buffer)
}

/**
 * The "set" function of the Struct "type" interface
 */

function set (buffer, offset, value) {
  debug('Struct "type" setter for buffer at offset', buffer, offset, value)
  if (offset > 0) {
    buffer = buffer.slice(offset)
  }
  var struct = new this(buffer)
  var isStruct = value instanceof this
  if (isStruct) {
    // TODO: optimize - use Buffer#copy()
    Object.keys(this.fields).forEach(function (name) {
      // hopefully hit the setters
      struct[name] = value[name]
    })
  } else {
    for (var name in value) {
      // hopefully hit the setters
      struct[name] = value[name]
    }
  }
}

function toString () {
  return 'StructType'
}

/**
 * Adds a new field to the struct instance with the given name and type.
 * Note that this function will throw an Error if any instances of the struct
 * type have already been created, therefore this function must be called at the
 * beginning, before any instances are created.
 */

function defineProperty (name, type) {
  debug('defining new struct type field', name)

  // allow string types for convenience
  type = ref.coerceType(type)

  assert(!this._instanceCreated, 'an instance of this Struct type has already '
      + 'been created, cannot add new "fields" anymore')
  assert.equal('string', typeof name, 'expected a "string" field name')
  assert(type && /object|function/i.test(typeof type) && 'size' in type &&
      'indirection' in type
      , 'expected a "type" object describing the field type: "' + type + '"')
  assert(!(name in this.prototype), 'the field "' + name
      + '" already exists in this Struct type')

  // define the getter/setter property
  Object.defineProperty(this.prototype, name, {
      enumerable: true
    , configurable: true
    , get: get
    , set: set
  });

  var field = {
    type: type
  }
  this.fields[name] = field

  // calculate the new size and field offsets
  recalc(this)

  function get () {
    debug('getting "%s" struct field (offset: %d)', name, field.offset)
    return ref.get(this._pointer, field.offset, type)
  }

  function set (value) {
    debug('setting "%s" struct field (offset: %d)', name, field.offset, value)
    return ref.set(this._pointer, field.offset, value, type)
  }
}

function recalc (struct) {

  // reset size and alignment
  struct.size = 0
  struct.alignment = 0

  var fieldNames = Object.keys(struct.fields)

  // first loop through is to determine the `alignment` of this struct
  fieldNames.forEach(function (name) {
    var field = struct.fields[name]
    var type = field.type
    var alignment = type.alignment || ref.alignof.pointer
    if (type.indirection > 1) {
      alignment = ref.alignof.pointer
    }
    struct.alignment = Math.max(struct.alignment, alignment)
  })

  // second loop through sets the `offset` property on each "field"
  // object, and sets the `struct.size` as we go along
  fieldNames.forEach(function (name) {
    var field = struct.fields[name]
    var type = field.type

    var offset = struct.size
    var left = offset % struct.alignment
    var size = type.indirection === 1 ? type.size : ref.sizeof.pointer

    if (size > left) {
      offset += left
    }
    struct.size = offset + size

    field.offset = offset
  })

  // any final padding?
  var left = struct.size % struct.alignment
  if (left > 0) {
    debug('additional padding to the end of struct:', struct.alignment - left)
    struct.size += struct.alignment - left
  }
}

/**
 * This is the custom prototype of Struct type instances.
 */

var proto = {}

// set a placeholder variable on the prototype so that defineProperty() will
// throw an error if you try to define a struct field with the name "_pointer"
proto._pointer = ref.NULL

proto.ref = function ref () {
  return this._pointer
}
