#include <stdlib.h>
#include "v8.h"
#include "node.h"

#ifdef _WIN32
  #define __alignof__ __alignof
#endif

using namespace v8;
using namespace node;

namespace {

typedef struct _test1 {
  int a;
  int b;
  double c;
} test1;

typedef struct _test2 {
  int a;
  double b;
  int c;
} test2;

typedef struct _test3 {
  double a;
  int b;
  int c;
} test3;

typedef struct _test4 {
  double a;
  double b;
  int c;
} test4;

typedef struct _test5 {
  int a;
  double b;
  double c;
} test5;

typedef struct _test6 {
  char a;
  short b;
  int c;
} test6;

typedef struct _test7 {
  int a;
  short b;
  char c;
} test7;

typedef struct _test8 {
  int a;
  short b;
  char c;
  char d;
} test8;

typedef struct _test9 {
  int a;
  short b;
  char c;
  char d;
  char e;
} test9;

typedef struct _test10 {
  test1 a;
  char b;
} test10;

// this one simulates the `ffi_type` struct
typedef struct _test11 {
  size_t a;
  unsigned short b;
  unsigned short c;
  struct _test11 **d;
} test11;

typedef struct _test12 {
  char *a;
  int b;
} test12;

typedef struct _test13 {
  char a;
  char b[2];
} test13;

typedef struct _test14 {
  char a;
  char b[2];
  short c;
  char d;
} test14;

typedef struct _test15 {
  test1 a;
  test1 b;
} test15;

void Initialize(Handle<Object> target) {
  HandleScope scope;

  target->Set(String::NewSymbol("test1 sizeof"), Number::New(sizeof(test1)));
  target->Set(String::NewSymbol("test1 alignof"), Number::New(__alignof__(test1)));
  target->Set(String::NewSymbol("test1 offsetof a"), Number::New(offsetof(test1, a)));
  target->Set(String::NewSymbol("test1 offsetof b"), Number::New(offsetof(test1, b)));
  target->Set(String::NewSymbol("test1 offsetof c"), Number::New(offsetof(test1, c)));

  target->Set(String::NewSymbol("test2 sizeof"), Number::New(sizeof(test2)));
  target->Set(String::NewSymbol("test2 alignof"), Number::New(__alignof__(test2)));
  target->Set(String::NewSymbol("test2 offsetof a"), Number::New(offsetof(test2, a)));
  target->Set(String::NewSymbol("test2 offsetof b"), Number::New(offsetof(test2, b)));
  target->Set(String::NewSymbol("test2 offsetof c"), Number::New(offsetof(test2, c)));

  target->Set(String::NewSymbol("test3 sizeof"), Number::New(sizeof(test3)));
  target->Set(String::NewSymbol("test3 alignof"), Number::New(__alignof__(test3)));
  target->Set(String::NewSymbol("test3 offsetof a"), Number::New(offsetof(test3, a)));
  target->Set(String::NewSymbol("test3 offsetof b"), Number::New(offsetof(test3, b)));
  target->Set(String::NewSymbol("test3 offsetof c"), Number::New(offsetof(test3, c)));

  target->Set(String::NewSymbol("test4 sizeof"), Number::New(sizeof(test4)));
  target->Set(String::NewSymbol("test4 alignof"), Number::New(__alignof__(test4)));
  target->Set(String::NewSymbol("test4 offsetof a"), Number::New(offsetof(test4, a)));
  target->Set(String::NewSymbol("test4 offsetof b"), Number::New(offsetof(test4, b)));
  target->Set(String::NewSymbol("test4 offsetof c"), Number::New(offsetof(test4, c)));

  target->Set(String::NewSymbol("test5 sizeof"), Number::New(sizeof(test5)));
  target->Set(String::NewSymbol("test5 alignof"), Number::New(__alignof__(test5)));
  target->Set(String::NewSymbol("test5 offsetof a"), Number::New(offsetof(test5, a)));
  target->Set(String::NewSymbol("test5 offsetof b"), Number::New(offsetof(test5, b)));
  target->Set(String::NewSymbol("test5 offsetof c"), Number::New(offsetof(test5, c)));

  target->Set(String::NewSymbol("test6 sizeof"), Number::New(sizeof(test6)));
  target->Set(String::NewSymbol("test6 alignof"), Number::New(__alignof__(test6)));
  target->Set(String::NewSymbol("test6 offsetof a"), Number::New(offsetof(test6, a)));
  target->Set(String::NewSymbol("test6 offsetof b"), Number::New(offsetof(test6, b)));
  target->Set(String::NewSymbol("test6 offsetof c"), Number::New(offsetof(test6, c)));

  target->Set(String::NewSymbol("test7 sizeof"), Number::New(sizeof(test7)));
  target->Set(String::NewSymbol("test7 alignof"), Number::New(__alignof__(test7)));
  target->Set(String::NewSymbol("test7 offsetof a"), Number::New(offsetof(test7, a)));
  target->Set(String::NewSymbol("test7 offsetof b"), Number::New(offsetof(test7, b)));
  target->Set(String::NewSymbol("test7 offsetof c"), Number::New(offsetof(test7, c)));

  target->Set(String::NewSymbol("test8 sizeof"), Number::New(sizeof(test8)));
  target->Set(String::NewSymbol("test8 alignof"), Number::New(__alignof__(test8)));
  target->Set(String::NewSymbol("test8 offsetof a"), Number::New(offsetof(test8, a)));
  target->Set(String::NewSymbol("test8 offsetof b"), Number::New(offsetof(test8, b)));
  target->Set(String::NewSymbol("test8 offsetof c"), Number::New(offsetof(test8, c)));
  target->Set(String::NewSymbol("test8 offsetof d"), Number::New(offsetof(test8, d)));

  target->Set(String::NewSymbol("test9 sizeof"), Number::New(sizeof(test9)));
  target->Set(String::NewSymbol("test9 alignof"), Number::New(__alignof__(test9)));
  target->Set(String::NewSymbol("test9 offsetof a"), Number::New(offsetof(test9, a)));
  target->Set(String::NewSymbol("test9 offsetof b"), Number::New(offsetof(test9, b)));
  target->Set(String::NewSymbol("test9 offsetof c"), Number::New(offsetof(test9, c)));
  target->Set(String::NewSymbol("test9 offsetof d"), Number::New(offsetof(test9, d)));
  target->Set(String::NewSymbol("test9 offsetof e"), Number::New(offsetof(test9, e)));

  target->Set(String::NewSymbol("test10 sizeof"), Number::New(sizeof(test10)));
  target->Set(String::NewSymbol("test10 alignof"), Number::New(__alignof__(test10)));
  target->Set(String::NewSymbol("test10 offsetof a"), Number::New(offsetof(test10, a)));
  target->Set(String::NewSymbol("test10 offsetof b"), Number::New(offsetof(test10, b)));

  target->Set(String::NewSymbol("test11 sizeof"), Number::New(sizeof(test11)));
  target->Set(String::NewSymbol("test11 alignof"), Number::New(__alignof__(test11)));
  target->Set(String::NewSymbol("test11 offsetof a"), Number::New(offsetof(test11, a)));
  target->Set(String::NewSymbol("test11 offsetof b"), Number::New(offsetof(test11, b)));
  target->Set(String::NewSymbol("test11 offsetof c"), Number::New(offsetof(test11, c)));
  target->Set(String::NewSymbol("test11 offsetof d"), Number::New(offsetof(test11, d)));

  target->Set(String::NewSymbol("test12 sizeof"), Number::New(sizeof(test12)));
  target->Set(String::NewSymbol("test12 alignof"), Number::New(__alignof__(test12)));
  target->Set(String::NewSymbol("test12 offsetof a"), Number::New(offsetof(test12, a)));
  target->Set(String::NewSymbol("test12 offsetof b"), Number::New(offsetof(test12, b)));

  target->Set(String::NewSymbol("test13 sizeof"), Number::New(sizeof(test13)));
  target->Set(String::NewSymbol("test13 alignof"), Number::New(__alignof__(test13)));
  target->Set(String::NewSymbol("test13 offsetof a"), Number::New(offsetof(test13, a)));
  target->Set(String::NewSymbol("test13 offsetof b"), Number::New(offsetof(test13, b)));

  target->Set(String::NewSymbol("test14 sizeof"), Number::New(sizeof(test14)));
  target->Set(String::NewSymbol("test14 alignof"), Number::New(__alignof__(test14)));
  target->Set(String::NewSymbol("test14 offsetof a"), Number::New(offsetof(test14, a)));
  target->Set(String::NewSymbol("test14 offsetof b"), Number::New(offsetof(test14, b)));
  target->Set(String::NewSymbol("test14 offsetof c"), Number::New(offsetof(test14, c)));
  target->Set(String::NewSymbol("test14 offsetof d"), Number::New(offsetof(test14, d)));

  target->Set(String::NewSymbol("test15 sizeof"), Number::New(sizeof(test15)));
  target->Set(String::NewSymbol("test15 alignof"), Number::New(__alignof__(test15)));
  target->Set(String::NewSymbol("test15 offsetof a"), Number::New(offsetof(test15, a)));
  target->Set(String::NewSymbol("test15 offsetof b"), Number::New(offsetof(test15, b)));

}

} // anonymous namespace

NODE_MODULE(struct_tests, Initialize);
