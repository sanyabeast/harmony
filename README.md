# harmony

## Meta

Each harmony instance has at least one worker with workerUID == "master" created by defaut.
Pass workerUID different from the "master" to create and do things at new worker.

## Running code at worker

```javascript
//harmony.run(string:workerUID, func:callback, obj||undef:data)
harmony.run("master", function(data){
    console.log(this);//DedicatedWorkerGlobalScope {...}
    console.log(data);//{hello: "Hello World!"}
}, { hello : "Hello World!" });

```

## Defining variable at master worker`s scope

```javascript
//defining
//harmony.define(string:workerUID, string:key, any:value)
harmony.define("master", "unixtime", +new Date());

```

## Defining variable at custom worker`s scope

```javascript
//defining
//harmony.define(string:workerUID, string:key, any:value)
harmony.define("backstage", "greet", function(name){
    console.log("Hello, " + name);
});

//worker with workerUID == "backstage" has just been created if it was not exist.
//using
harmony.run("backstage", function(){
    self.greet("Gordon Freeman");
});

```

## Evaluating code at worker`s scope

```javascript
//harmony.eval(string:workerUID, string:code, obj||undef:templateSettings);
harmony.eval("fairyland", "var bool = true; console.log(\"Hello, \" + \"$name\")", {
    name : "Carl Johnson"
});

```

## Extra
### Harmony.prototype.util

```javascript
harmony.util.template("Hello, $mName! My name is $uName. Glad to see you!", {
    mName : "Romeo",
    uName : "Juliette"
});
//"Hello, Romeo! My name is Juliette. Glad to see you!"
```

