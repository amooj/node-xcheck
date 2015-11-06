# node-xcheck
Templated data validation for Node.js.

## What' xcheck For?
Suppose that you are implementing several RESTful APIs. Each API accepts an object as argument and returns something. Your code probably goes like this
```js
function myService(query){
  // validates the arguments
  let name = query.name || 'anonymous';
  let secret = query.secret || '';
  let email = query.email;
  if (!email){
    throw new Error('email is required.');
  }
  
  // work, work, work
  
  return data;
}
```
This is no big deal, though the argument validation is a bit tedious. 
But when things get more complicated, you have to write dozens of if-else to do the validation. That's quite awful and error prone.

_xcheck_ will do the dirty work for you.

## Quick Start

```js
let template = xcheck.createTemplate({
  name: 'anonymous',
  secret: '',
  'email not null': ':string'
});

// d1 will fail the validation
let d1 = {name: 'tom', secret: '******'};
template.validate(d1); // will throw TypeError

// d2 will pass the validation
let d2 = {email: 'hi@example.com'};
template.validate(d2, {applyDefaults: true});

// The following assertions should pass.
assert(d2.name === 'anonymous');
assert(d2.secret === '');
assert(d2.email === 'hi@example.com');
```

Now, some explanation for how _xcheck_ works. 

By calling `xcheck.createTemplate({...})`, an _ObjectTemplate_ is created, which define couple of constraints on an object as below:

- The object **should** be of _Object_ type, not a _string_, a _number_ or anything else.
- The object **may** have 2 properties:
    - `name`, which should be a _string_. If `name` is missing in the object, `name` has a default value "anonymous".
    - `secret`, which should be a _string_ and, if missing, is defaulted to empty string.
- The object **should** have `email` property, which should be a _string_.

Then by calling `template.validate(d1)`, `d1` is validated for compliance with these constraints. Since `email` property is required by the template and `d1.email` is `undefined`, `d1` will fail the validation. Thus a _TypeError_ exception will be thrown. 

With `applyDefaults` option is set `true`, `template.validate(d2)` will add any properties that are missing into the validated object. Thus `d2.name` is assigned to default name value `'anonymous'`.

## Template Syntax
Actually, _xcheck_ can also validate _Array_, _string_, _number_ ant etc. Besides _ObjectTemplate_, there are _ArrayTemplate_ and _ValueTemplate_. Templates can be nested composed exactly as JSON.

_ValueTemplate := 
&nbsp;&nbsp;&nbsp;&nbsp;"typename SP \[default SP json_value\]" | ObjectTemplate | ArrayTemplate_

_ArrayTemplate := 
&nbsp;&nbsp;&nbsp;&nbsp;\[ ValueTemplate \]_

_ObjectTemplate :=
&nbsp;&nbsp;&nbsp;&nbsp;{ PropertyTemplate \[,PropertyTemplate\] }_

_PropertyTemplate :=
&nbsp;&nbsp;&nbsp;&nbsp;" property_name \[required\] \[not SP null\] \[default SP json_value\]" : ValueTemplate_

Here are typename's that are supported:

| typename | Node.js type | since |
| ---- | ---- | ---- |
| :number | number | * |
| :int | number, accepts only integer | * | 
| :string | string | * |
| :boolean | boolean | * |
| :null | object, accepts only null | * | 
| :char | string, accepts single character | * |

> Note that typename is prefixed with a colon. So if you want to create a string template that has a default value starts with colon, you need to add an extra colon.
> `let str = xcheck.createTemplate('::my string starts with colon');`

Here are more examples to build templates:

```js
// creates a ValueTemplate that accepts an int
let int = xcheck.createTemplate(":int default 1");

// atomic value template with default value can be shorttened
int = xcheck.createTemplate(1); // exactly same as above
let str = xcheck.createTemplate(''); // accepts string, defaults to empty string

// creates an ArrayTemplate that accepts Array<String>
let strarray = xcheck.createTemplate(['']);
strarray.validate(['this', 'is', 'ok']); // ok
strarray.validate([1, 2, 3]); // fail
strarray.validate(['this', 'is', 'weird', 1, 2, 3]); // fail

// creates an ObjectTemplate that accepts complex objects
let t = xcheck.createTemplate({
  'names not null': [':string'],
  'courses not null': [{
     'id not null': ':int',
     'code not null': ':string',
     'level': 1
  }],
  
  // location should be Array<String>, defaults to ['CN']
  'locations default ["CN"]': [":string"]
});
```

Generally you do not care about what type of the template is. Just describe what you want, call `xcheck.createTemplate()`, then validate data using the returned template.

## Restrictions
These are what _xcheck_ can't do for you:

* Validating an array of isomers.
* Tricky validation, i.e. you should check the correctness of a URL by yourself. 

## Comming More Features
The following features are in plan:

* Supports for other useful types, such as _Date_.
* Supports for customized typename.
* Supports for code snippet in ValueTemplate like `:int {value>=0}` or `:string {value.length <= 5}`.
