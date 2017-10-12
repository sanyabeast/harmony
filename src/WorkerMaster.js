"use strict";
define(function(){

    class WorkerMaster {
        constructor(){
            this.worker = this.createWorker(this.wrapSource(this.masterWorkerSource, {
                workerID : "\"master\""
            }), this.onMasterWorkerMessage);
            this.customWorkers = {};
        }

        post(data, worker){
            worker = worker || this.worker;
            worker.postMessage(this.wrapPostData(data));
        }

        wrapPostData(data){
            var dataContainer = {
                type : typeof data,
                value : data
            };

            if (dataContainer.type == "function"){
                dataContainer.type = "function";
                dataContainer.value = data.toString();
            }

            return dataContainer;
        }

        createWorker(/*str*/workerSource){
            var workerID = this.randString("worker-");

            if (typeof workerSource == "function"){
                workerSource = this.wrapSource(workerSource);
            }

            var worker = new window.Worker(window.URL.createObjectURL(
                new window.Blob([ workerSource ], { type: "text/javascript" })
            ));

            return worker;
        }

        createExtraWorker(/*fun || str*/workerSource, /*fun || undef*/callback){

            var worker = this.createWorker(workerSource);

            worker.id = workerID;

            worker.onmessage = this.onWorkerMessage.bind(this, workerID);

            this.customWorkers[workerID] = {
                worker : worker,
                callback : callback
            };

            return worker;
        }

        onMasterWorkerMessage(workerID, messageEvent){
            log(arguments);
        }

        onWorkerMessage(workerID, messageEvent){
            log(workerID, messageEvent);

            if (this.customWorkers[workerID].callback){
                this.customWorkers[workerID].callback(messageEvent);
            }
        }

        template(string, settings){
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

        masterWorkerSource(){
            self.log = self.console.log.bind(self.console);

            const WORKER_ID = $workerID;

            log(WORKER_ID);

            class WorkerClient{
                constructor(){
                    self.onmessage = this.onMessage.bind(this)
                }

                onMessage(message){
                    var data = message.data;
                    log(data);
                }
            }

            self.workerClient = new WorkerClient();
            
        }

        randString(prefix){ return (prefix || "") + Math.random().toString(32).substring(3, 13); }

        wrapSource(/*fun*/workerSource, /*obj*/vars){
            var strSource = workerSource.toString();
            strSource = (strSource.indexOf("function") == 0 ? "" : "function ") + strSource;
            strSource = this.template(strSource, vars);
            return ["(", strSource, ".call(self))"].join("");
        }
    };

    // log(WorkerMaster.toString());

    return WorkerMaster;

});