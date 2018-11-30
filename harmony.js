(function (root, factory) { if (typeof define === "function" && define.amd) { define([], factory); } else if (typeof module === "object" && module.exports) { module.exports = factory(true); } else { window.harmony = factory(); }
}(this, function(){
    'use strict';

    var harmony;

    /*Worker wrapper*/
    var WorkerManager = function(harmony, workerUID, workerSource){
        this.harmony = harmony;
        this.UID = workerUID;

        if (window.Worker){
            this.worker = new window.Worker(window.URL.createObjectURL(
                new window.Blob([ workerSource ], { type: "text/javascript" })
            ));
        } else {
            this.worker = new PseudoWorker(workerSource);
        }


        this.worker.onmessage = this.__onMessage.bind(this);
    };

    WorkerManager.prototype = {
        post : function(postRequest){
            var postData = {};
            var transferables = [];

            for (var k in postRequest){
                if (typeof postRequest[k] == "function"){
                    postData[k] = this.harmony.util.func2String(postRequest[k]);
                } else if (typeof postRequest[k] == "object" && postRequest[k] instanceof window.ArrayBuffer && postRequest.transfer !== false){
                    postData[k] = postRequest[k];
                    transferables.push(postData[k].buffer);
                } else {
                    postData[k] = postRequest[k];
                }
            }

            if (postRequest.data){
                postData.data = {};
                for (var k in postRequest.data){
                    // console.log(k);
                    if (typeof postRequest.data[k] == "function"){
                        postData.data[k] = this.harmony.util.func2String(postRequest.data[k]);
                    } else if (typeof postRequest.data[k] == "object" && postRequest.data[k].buffer instanceof window.ArrayBuffer && postRequest.transfer !== false){
                        console.log("transfering");
                        postData.data[k] = postRequest.data[k];
                        transferables.push(postData.data[k].buffer);
                    } else {
                        postData.data[k] = postRequest.data[k];
                    }
                }
            }

            this.worker.postMessage(postData, transferables);
        },
        kill : function(){
            this.worker.terminate();
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

        this.eventCallbacks = {};
        this.harmonyCallbacks = {};

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
                var matches = string.match(/\$[^${ ";,.!]*/g) || [];
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
            },
            createCallback : function(callback, callbackUID){
                
            }
        },
        extra : {
            workerSource : function(){
                var window = self;
                var WORKER_ID = self.WORKER_ID = "$workerUID";
                var LOG_ENABLED = $logEnabled;

                LOG_ENABLED && console.log(["harmony:", WORKER_ID,  "is running..."].join(" "));
                
                var __toFuncCache = {};
                var __toFunc = function(code){
                    if (typeof code == "function") return code;
                    code = code.split("func::")[1];
                    var result = __toFuncCache[code] || eval(["(", code, ")"].join(""));
                    __toFuncCache = result;
                    return result;
                };

                var post = function(postData){
                    var transferables = [];

                    console.log(postData, ArrayBuffer);

                    if (postData.data){
                        for (var k in postData.data){
                            if (typeof postData.data[k] == "object" && postData.data[k].buffer instanceof ArrayBuffer){
                                transferables.push(postData.data[k].buffer);
                            }
                        }
                    }

                    console.log(transferables);

                    self.postMessage(postData, transferables);
                    // console.log(data);
                    // LOG_ENABLED && console.log(["harmony:", WORKER_ID,  "just posted message"].join(" "));
                };


                var __run = function(command){
                    switch(command.type){
                        case "define":
                            var key = command.key;
                            var value = command.value;
                            self[key] = value;
                            typeof command.handler == "function" && command.handler.call(self, value, key); 
                        break;
                        case "exec":
                            var data = command.data;
                            var handler = command.handler;
                            typeof handler == "function" && handler.call(self, data);
                        break;
                        case "eval":
                            var code = command.code;
                            eval(code);
                        break;
                    }

                    //LOG_ENABLED && console.log(["harmony:", WORKER_ID,  "just run recieved command -", command.type].join(" "));
                };

                self.onmessage = function(messageEvt){
                    var data = messageEvt.data;

                    for (var k in data){
                        if (typeof data[k] == "string" && data[k].indexOf("func::") == 0){
                            data[k] = __toFunc(data[k]);
                        }
                    }

                    if (data && data.data && typeof data.data == "object"){
                        for (var k in data.data){
                            if (typeof data.data[k] == "string" && data.data[k].indexOf("func::") == 0){
                                data.data[k] = __toFunc(data.data[k]);
                            }
                        }
                    }

                    __run.call(self, data);
                };

            }
        },
        Harmony : Harmony,
        WorkerManager : WorkerManager,
        callback : function(callback){
            var callbackUID = this.util.genUID("harmony-callback");
            this.harmonyCallbacks[callbackUID] = callback;

            var workerCallback = function(data){
                post({
                    harmonyCallbackUID : "$callbackUID",
                    data : data
                });
            };

            return this.util.template(this.util.func2String(workerCallback), {
                callbackUID : callbackUID
            });

        },
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
        define : function(workerUID, key, value){
            var worker = this.__getWorker(workerUID);

            worker.post({
                type : "define",
                key : key,
                value : value
            }); 

            return this;
        },
        run : function(workerUID, handler, data, transfer){
            var worker = this.__getWorker(workerUID);
            worker.post({
                type : "exec",
                handler : handler,
                data : data,
                transfer : typeof transfer == "boolean" ? transfer : true
            }); 

            return this;
        },
        eval : function(workerUID, code, settings){
            var worker = this.__getWorker(workerUID);

            worker.post({
                type : "eval",
                code : this.util.template(code, settings),
            }); 

            return this;

        },
        putMessage : function(workerUID, data){
            this.eventCallbacks[workerUID] = this.eventCallbacks[workerUID] || {};

            if (data.harmonyCallbackUID){
                var callback = this.harmonyCallbacks[data.harmonyCallbackUID];
                callback(data.data);
                // delete this.harmonyCallbacks[data.harmonyCallbackUID];
                return;
            }

            this.util.iterateObj(this.eventCallbacks[workerUID], function(callback, subUID){
                callback(data, subUID, workerUID, this);
            }, this);
        },
        __getWorker : function(workerUID){
            var worker = this.workers[workerUID] || this.__createWorker(workerUID);
            this.workers[workerUID] = worker;
            return worker;
        },
        __postMessage : function(workerUID, data){
            this.workers[workerUID].post(data);
        },
        __createWorker : function(workerUID){
            var worker = new this.WorkerManager(this, workerUID, this.util.toIIFEString(this.extra.workerSource, {
                workerUID : workerUID,
                logEnabled : true
            }));

            return worker;
        }
    };


    return new Harmony;

}));