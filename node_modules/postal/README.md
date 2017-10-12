# nuPostal

## Postal scheme 

### Subscribing

```javascript
bar subscription = postal.subscribe({
  channel : "kek",
  topic : "lol",
  callback : function(data){
    console.log("Hello!", data);
  },
  context : window
});
```

### Publishing

```javascript
postal.publish({
  channel : "kek",
  topic : "lol",
  data : "Goodbye!"
});

//Hello!, Goodbye!

```

### Unsubscribing

```javascript
subscription.unsubscribe();
```

### Resubscribing

```javascript
subscription.resubscribe();
```

## Signals scheme 

### Listening

```javascript
var subscription = postal.listen("logdata", function(data){
  console.log(data);
});
```

### Saying

```javascript
postal.say("logdata", { random : Math.random() });
//{random : 0.2943779978464365 }
```
