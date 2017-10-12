"use strict";
define(function(){

    function toFunc(code){ return eval(["(", code, ")"].join("")); }

    var messageHandlers = {
        "exec-async" : function(execData){
            return this.callbacks[execData.execAsyncID] && this.callbacks[execData.execAsyncID](execData.data) || false;      
        }
    };

    class Harmony {
        constructor(){
            const MASTER_WORKER_ID = this.randString("master");
            this.onWorkerMessage = this.onWorkerMessage.bind(this);

            this.worker = this.createWorker(this.wrapSource(this.masterWorkerSource, {
                workerID : "\"" + MASTER_WORKER_ID + "\"",
                isMaster : true
            }), MASTER_WORKER_ID);

            this.customWorkers = {};
            this.callbacks = {};
        }

        /*fasters*/

        run(onStart, onComplete){
            this.postMaster({
                onStart : onStart,
                onComplete : onComplete,
            }, "exec-async")
        }

        /*~~~~~~~~~~~~~~*/

        get messageHandlers(){
            return messageHandlers;
        }

        masterWorkerSource(){
            function toFunc(code){ return eval(["(", code, ")"].join("")); }
            self.log = self.console.log.bind(self.console);

            const WORKER_ID = $workerID;
            const IS_MASTER = $isMaster;

            log(WORKER_ID);

            var messageHandlers = {
                "define" : function(data){
                    self[data.name] = data.value;
                },
                "log" : function(data){
                    console.log(self, this, data);
                },
                "exec" : function(data){
                    log(arguments);
                    data.value(data);
                },
                "exec-async" : function(data){
                    log(data);
                    var callback = toFunc(data.value.callback);
                    var execAsyncID = data.value.execAsyncID;

                    callback(data, function(outputDate){
                        this.post({
                            execAsyncID : execAsyncID,
                            data : outputDate
                        }, "exec-async");
                    }.bind(this));

                },
                "repost" : function(data){
                    this.post(data, "repost");
                }
            };

            class WorkerAgent{
                constructor(){
                    self.onmessage = this.onMessage.bind(this)
                }

                get messageHandlers(){
                    return messageHandlers;
                }

                post(/*any*/data, /*str||undef*/action){
                    self.postMessage({
                        workerID : WORKER_ID,
                        isMaster : IS_MASTER,
                        data : data,
                        action : action
                    });
                }

                onMessage(/*self.Message*/message){
                    var data = message.data;
                    if (data.type == "function") data.value = toFunc(data.value);

                    if (this.messageHandlers[data.action]){
                        this.messageHandlers[data.action].call(this, data);
                    } else {
                    }
                }
            }

            self.workerClient = new WorkerAgent();
            
        }

        post(/*window.Worker*/worker, /*any*/data, /*str||undef*/action){
            worker.postMessage(this.wrapPostData(data, action));
        }

        postMaster(/*any*/data, /*srt*/action){
            this.post(this.worker, data, action);
        }

        wrapPostData(/*any*/data, /*str||undef*/action){
            var dataContainer = {
                type : typeof data,
                action : action
            };

            if (dataContainer.type == "function"){
                dataContainer.type = "function";
                dataContainer.value = data.toString();
            } else if (action == "exec-async"){
                let execAsyncID = this.randString("exec-async-cb");

                dataContainer.value = {
                    callback : data.onStart.toString(),
                    execAsyncID : execAsyncID,
                };

                this.callbacks[execAsyncID] = data.onComplete;
            } else {
                dataContainer.value = data;
            }

            return dataContainer;
        }

        createWorker(/*str*/workerSource, /*str||undef*/id){
            var workerID = id || this.randString("worker");

            if (typeof workerSource == "function"){
                workerSource = this.wrapSource(workerSource);
            }


            var worker = new window.Worker(window.URL.createObjectURL(
                new window.Blob([ workerSource ], { type: "text/javascript" })
            ));

            worker.id = workerID;
            worker.onmessage = this.onWorkerMessage;

            return worker;
        }

        createExtraWorker(/*fun||str*/workerSource, /*fun||undef*/callback){

            var worker = this.createWorker(workerSource);            

            this.customWorkers[workerID] = {
                worker : worker,
                callback : callback
            };

            return worker;
        }

        onMasterWorkerMessage(/*obj*/dataContainer){
            this.messageHandlers[dataContainer.action] && this.messageHandlers[dataContainer.action].call(this, dataContainer.data);
        }

        onWorkerMessage(/*window.MessageEvent*/messageEvent){
            var dataContainer = messageEvent.data;

            if (dataContainer.isMaster){
                this.onMasterWorkerMessage(dataContainer);
                return;
            }

            var workerID = dataContainer.workerID;

            if (this.customWorkers[workerID] && this.customWorkers[workerID].callback){
                this.customWorkers[workerID].callback(messageEvent);
            }
        }

        template(string, /*obj*/settings){
            if (!settings) return string;
            var matches = string.match(/\$[^${ ;,]*/g) || [];
            var vars = [];

            for (var a = 0, l = matches.length, name; a < l; a++){
                name = matches[a].replace("$", "");
                if (vars.indexOf(name) < 0) vars.push(name);
            }

            for (var a = 0, l = vars.length; a < l; a++){
                string = string.replace(new RegExp("\\$" + vars[a], "g"), (typeof settings[vars[a]] == "undefined" ? "" : settings[vars[a]]));
            }

            return string;
        }

        randString(/*str*/prefix){ return [(prefix || ""), Math.random().toString(32).substring(3, 13)].join("-"); }

        wrapSource(/*fun*/workerSource, /*obj*/vars){
            var strSource = workerSource.toString();
            strSource = (strSource.indexOf("function") == 0 ? "" : "function ") + strSource;
            strSource = this.template(strSource, vars);
            return ["(", strSource, ".call(self))"].join("");
        }
    };

    // log(Harmony.toString());

    return Harmony;

});