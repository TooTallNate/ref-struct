
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

var assert = require('assert')


/**
 * The Struct "type" constructor-constructor.
 */

function Struct (fields) {

  /**
   * This is the Constructor of the Struct type that gets returned.
   *
   * Invoke it with `new` to create a new Buffer instance backing the struct.
   * Pass it an existing Buffer instance to use that as the backing buffer.
   * Pass in an Object containing the struct fiels to auto-populate the struct
   * with the data.
   */

  var constructor = function (arg, data) {
    if (!(this instanceof constructor)) {
      return new constructor(arg, data)
    }
    if (Buffer.isBuffer(arg)) {
      assert(arg.length >= this.size, 'Buffer instance must be at least '
          + this.size + ' bytes to back this struct type')
      this.pointer = arg
      arg = data
    } else {
      this.pointer = new Buffer(this.size)
    }
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
  constructor.alignment = 0
  // Setup the ref "type" interface. The constructor doubles as the "type" object
  constructor.size = 0
  constructor.indirection = 1
  constructor.get = get
  constructor.set = set
  //constructor._isStructType = true


  // Read the fields list and apply all the fields to the struct
  Object.keys(fields).forEach(function (name) {
    var type = fields[name]
    constructor.defineProperty(name, type)
  })

  /*
  for (var i = 0, len = fields.length; i < len; i++) {
    var field   = fields[i]
      , type    = field[0]
      , name    = field[1]
    //console.log(name)

    if (name in struct.struct) {
      throw new Error('Error when constructing Struct: ' + name + ' field specified twice!')
    }

    var stype   = ffi.isStructType(type)
      , sz      = ffi.sizeOf(type)
      , asz     = stype ? type.__structInfo__.alignment : sz
    //console.log('  size:',sz)
    //console.log('  offset:', struct.size)
    //console.log('  asz:',asz)

    struct.alignment  = Math.max(struct.alignment, asz)

    var left = struct.size % struct.alignment
      , offset = struct.size

    if (sz > left) {
      offset += left
    }

    struct.size = offset + sz

    struct.struct[name] = {
        name: name
      , type: type
      , size: sz
      , offset: offset
    }
    struct.members.push(name)
  }
  //console.log('before left:', struct.size, struct.alignment)
  var left = struct.size % struct.alignment
  if (left) {
    struct.size += struct.alignment - left
  }
  //console.log('after left:', struct.size)
  */




  // Function to return an `FFI_TYPE` struct instance from this struct
  // TODO: Move to `node-ffi`
  /*
  constructor._ffiType = function ffiType () {
    // return cached if available
    if (this._ffiTypeCached) {
      return this._ffiTypeCached
    }
    var props = this.__structInfo__.struct
      , propNames = Object.keys(props)
      , numProps = propNames.length
    var t = new ffi.FFI_TYPE()
    t.size = 0
    t.alignment = 0
    t.type = 13 // FFI_TYPE_STRUCT
    t.elements = new ffi.Pointer(ffi.Bindings.POINTER_SIZE * (numProps+1))
    var tptr = t.elements.clone()
    for (var i=0; i<numProps; i++) {
      var prop = props[propNames[i]]
      tptr.putPointer(ffi.ffiTypeFor(prop.type), true)
    }
    // Final NULL pointer to terminate the Array
    tptr.putPointer(ffi.Pointer.NULL)
    return this._ffiTypeCached = t
  }
  */

  return constructor
}
module.exports = Struct

/**
 * The "get" function of the Struct "type" interface
 */

function get (buffer, offset) {
  if (offset > 0) {
    buffer = buffer.slice(offset)
  }
  return new this(buffer)
}

/**
 * The "set" function of the Struct "type" interface
 */

function set (buffer, offset, value) {
  var isStruct = value instanceof this
  var struct = new this(buffer)
  if (isStruct) {
    // TODO: optimize?
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

/**
 * Adds a new field to the struct instance with the given name and type.
 * Note that this function will throw an Error if any instances of the struct
 * type have already been created, therefore this function must be called at the
 * beginning, before any instances are created.
 */

function defineProperty (name, type) {
  assert(!this._instanceCreated, 'an instance of this Struct type has already '
      + 'been created, cannot add new "fields" anymore')
  assert.equal('string', typeof name, 'expected a string field name')
  assert(!!type, 'expected a "type" object describing the field type')
  assert(!(name in this.prototype), 'the field "' + name
      + '" already exists in this Struct type')

  var sz  = type.size
  var asz = type.alignment || sz
  //console.error('  size:', sz)
  //console.error('  offset:', this.size)
  //console.error('  asz:', asz)

  this.alignment  = Math.max(this.alignment, asz)

  var left = this.size % this.alignment
    , offset = this.size

  if (sz > left) {
    offset += left
  }
  this.size = offset + asz


  // define the getter/setter property
  Object.defineProperty(this.prototype, name {
      enumerable: true
    , configurable: true
    , get: get
    , set: set
  });

  var field = {
      offset: offset
    , type: type
  }
  this.fields[name] = field

  function get () {
    return ref.get(this.pointer, field.offset, type)
  }

  function set (value) {
    return ref.set(this.pointer, field.offset, type, value)
  }
}

/**
 * This is the custom prototype of Struct type instances.
 */

var proto = Object.create(Function.prototype)

proto._isStructInstance = true

proto.ref = function ref () {
  return this.pointer
}
