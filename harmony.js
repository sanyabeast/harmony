var depenedncies = [];

(function (root, factory) { if (typeof define === "function" && define.amd) { define(depenedncies, factory); } else if (typeof module === "object" && module.exports) { module.exports = factory(true); } else { window.harmony = factory(); }
}(this, function(){

    var harmony;

    /*Worker wrapper*/
    var WorkerManager = function(harmony, workerUID, workerSource){
        this.harmony = harmony;
        this.UID = workerUID;

        this.worker = new window.Worker(window.URL.createObjectURL(
            new window.Blob([ workerSource ], { type: "text/javascript" })
        ));

        this.worker.onmessage = this.__onMessage.bind(this);
    };

    WorkerManager.prototype = {
        post : function(data){
            var postData = {};

            for (var k in data){
                if (typeof data[k] == "function"){
                    postData[k] = this.harmony.util.func2String(data[k]);
                } else {
                    postData[k] = data[k];
                }
            }

            this.worker.postMessage(postData);
        },
        __onMessage : function(messageEvt){
            var data = messageEvt.data;
            this.harmony.putMessage(this.UID, data);
        }
    };

    /*Harmony*/
    var Harmony = function(){
        if (harmony instanceof Harmony && newInstance != true){
            return harmony;
        }

        this.UID = this.util.genUID("harmony");

        this.eventCallbacks = {}

        this.workers = { 
            master : this.__createWorker("master-worker"),
        };

        harmony = this;
    };

    Harmony.prototype = {
        util : {
            genUID : function(prefix){ return [prefix, (Math.random().toString(32).substring(3, 12))].join("-"); },
            toIIFEString : function(func, vars){
                vars = vars || {};
                var strSource = func.toString();
                strSource = (strSource.indexOf("function") == 0 ? "" : "function ") + strSource;
                strSource = this.template(strSource, vars);
                return ["(", strSource, ".call(self))"].join("");
            },
            template : function(string, /*obj*/settings){
                if (!settings) return string;
                var matches = string.match(/\$[^${ ";,]*/g) || [];
                var vars = [];

                for (var a = 0, l = matches.length, name; a < l; a++){
                    name = matches[a].replace("$", "");
                    if (vars.indexOf(name) < 0) vars.push(name);
                }

                for (var a = 0, l = vars.length; a < l; a++){
                    string = string.replace(new RegExp("\\$" + vars[a], "g"), (typeof settings[vars[a]] == "undefined" ? "" : settings[vars[a]]));
                }

                return string;
            },
            func2String : function(func){
                if (typeof func == "string"){
                    return func;
                }

                var result = func.__stringified || func.toString();
                func.__stringified = result;
                result = "func::" + result;
                return result;
            },
            iterate : function(arr, callback, context){
                for (var a=0,l=arr.length;a<l;a++){ callback.call(context, arr[a], a, arr); }
            },
            iterateObj : function(obj, callback, context){
                for (var k in obj){callback.call(context, obj[k], k, obj); }
            }
        },
        extra : {
            workerSource : function(){
                var WORKER_ID = "$workerUID";
                
                var __toFuncCache = {};
                var __toFunc = function(code){
                    if (typeof code == "function") return code;
                    code = code.split("func::")[1];
                    var result = __toFuncCache[code] || eval(["(", code, ")"].join(""));
                    __toFuncCache = result;
                    return result;
                };

                var post = function(data){
                    self.postMessage(data);
                };

                var __run = function(command){
                    console.log(command);
                    switch(command.type){
                        case "define":
                            var key = command.key;
                            var value = command.value;
                            self[key] = value;
                            if (command.handler) command.handler.call(self, value, key); 
                        break;
                        case "exec":
                            var data = command.data;
                            var handler = command.handler;
                            handler.call(data);
                        break;
                    }
                };

                self.onmessage = function(messageEvt){
                    var data = messageEvt.data;

                    for (var k in data){
                        if (typeof data[k] == "string" && data[k].indexOf("func::") == 0){
                            data[k] = __toFunc(data[k]);
                        }
                    }

                    __run(data);
                };

            }
        },
        Harmony : Harmony,
        WorkerManager : WorkerManager,
        on : function(workerUID, callback, subUID){
            subUID = subUID || this.util.genUID("event-sub");
            this.eventCallbacks[workerUID] = this.eventCallbacks[workerUID] || {};
            this.eventCallbacks[workerUID][subUID] = callback;
            return subUID;
        },
        off : function(workerUID, subUID){
            this.eventCallbacks[workerUID] = this.eventCallbacks[workerUID] || {};
            delete this.eventCallbacks[workerUID][subUID];
            return this;
        },
        run : function(workerUID, data, handler){
            var worker = this.workers[workerUID] || this.__createWorker(workerUID);
            worker.__postMessage({
                type : "exec",
                handler : handler,
                data : data
            }); 

            return this;
        },
        putMessage : function(workerUID, data){
            this.eventCallbacks[workerUID] = this.eventCallbacks[workerUID] || {};
            this.util.iterateObj(this.eventCallbacks[workerUID], function(callback, subUID){
                callback(data, subUID, workerUID, this);
            }, this);
        },
        __postMessage : function(workerUID, data){
            this.workers[workerUID].post(data);
        },
        __createWorker(workerUID){
            var worker = new this.WorkerManager(this, workerUID, this.util.toIIFEString(this.extra.workerSource, {
                workerUID : workerUID
            }));

            return worker;
        }
    };


    return new Harmony;

}));