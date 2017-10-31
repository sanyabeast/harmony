"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {

    var harmony;

    function toFunc(code) {
        return eval(["(", code, ")"].join(""));
    }

    var messageHandlers = {
        "exec-await": function execAwait(dataContainer) {
            return this.callbacks[dataContainer.execAsyncID] && this.callbacks[dataContainer.execAsyncID](dataContainer.data) || false;
        },
        "return": function _return(dataContainer) {
            console.log(dataContainer);
            return this.callbacks[dataContainer.callbackID] && this.callbacks[dataContainer.callbackID](dataContainer.data);
            console.log(arguments);
        }
    };

    var Harmony = function () {
        function Harmony(newInstance) {
            _classCallCheck(this, Harmony);

            if (harmony instanceof Harmony && !newInstance) {
                return harmony;
            }

            var MASTER_WORKER_ID = this.randString("master");
            this.onWorkerMessage = this.onWorkerMessage.bind(this);

            this.worker = this.createWorker(this.wrapSource(this.masterWorkerSource, {
                workerID: "\"" + MASTER_WORKER_ID + "\"",
                isMaster: true
            }), MASTER_WORKER_ID);

            this.customWorkers = {};
            this.callbacks = {};
        }

        /*fasters*/

        _createClass(Harmony, [{
            key: "run",
            value: function run(onStart, onComplete) {
                if (onComplete) {
                    this.postMaster({
                        onStart: onStart,
                        onComplete: onComplete
                    }, "exec-await");
                } else {
                    this.postMaster(onStart, "exec");
                }
            }
        }, {
            key: "set",
            value: function set(name, value) {
                this.postMaster({
                    name: name,
                    value: value
                }, "define");
            }
        }, {
            key: "get",
            value: function get(name, handler) {
                var callbackID;

                if (handler) {
                    callbackID = this.randString("callback");
                    this.callbacks[callbackID] = handler;
                }

                this.postMaster({
                    name: name,
                    callbackID: callbackID
                }, "return");
            }

            /*~~~~~~~~~~~~~~*/

        }, {
            key: "masterWorkerSource",
            value: function masterWorkerSource() {
                function toFunc(code) {
                    return eval(["(", code, ")"].join(""));
                }
                self.log = self.console.log.bind(self.console);

                var WORKER_ID = $workerID;
                var IS_MASTER = $isMaster;

                log(WORKER_ID);

                var messageHandlers = {
                    "define": function define(data) {
                        self[data.value.name] = data.value.value;
                    },
                    "log": function log(data) {
                        console.log(self, this, data);
                    },
                    "exec": function exec(data) {
                        data.value.call(self, data);
                    },
                    "exec-await": function execAwait(data) {
                        log(data);
                        var callback = toFunc(data.value.callback);
                        var execAsyncID = data.value.execAsyncID;

                        callback.call(self, data, function (outputData) {
                            this.post({
                                execAsyncID: execAsyncID,
                                data: outputData
                            }, "exec-await");
                        }.bind(this));
                    },
                    "repost": function repost(data) {
                        this.post(data, "repost");
                    },
                    "return": function _return(data) {
                        var outputData = self[data.value.name];

                        this.post({
                            data: outputData,
                            callbackID: data.value.callbackID
                        }, "return");
                    }
                };

                var WorkerAgent = function () {
                    function WorkerAgent() {
                        _classCallCheck(this, WorkerAgent);

                        self.onmessage = this.onMessage.bind(this);
                    }

                    _createClass(WorkerAgent, [{
                        key: "post",
                        value: function post( /*any*/data, /*str||undef*/action) {
                            self.postMessage({
                                workerID: WORKER_ID,
                                isMaster: IS_MASTER,
                                data: data,
                                action: action
                            });
                        }
                    }, {
                        key: "onMessage",
                        value: function onMessage( /*self.Message*/message) {
                            var data = message.data;
                            if (data.type == "function") data.value = toFunc(data.value);

                            if (this.messageHandlers[data.action]) {
                                this.messageHandlers[data.action].call(this, data);
                            } else {}
                        }
                    }, {
                        key: "messageHandlers",
                        get: function get() {
                            return messageHandlers;
                        }
                    }]);

                    return WorkerAgent;
                }();

                self.workerClient = new WorkerAgent();
            }
        }, {
            key: "post",
            value: function post( /*window.Worker*/worker, /*any*/data, /*str||undef*/action) {
                worker.postMessage(this.wrapPostData(data, action));
            }
        }, {
            key: "postMaster",
            value: function postMaster( /*any*/data, /*srt*/action) {
                this.post(this.worker, data, action);
            }
        }, {
            key: "wrapPostData",
            value: function wrapPostData( /*any*/data, /*str||undef*/action) {
                var dataContainer = {
                    type: typeof data === "undefined" ? "undefined" : _typeof(data),
                    action: action
                };

                if (dataContainer.type == "function") {
                    dataContainer.type = "function";
                    dataContainer.value = data.toString();
                } else if (action == "exec-await") {
                    var execAsyncID = this.randString("exec-await-cb");

                    dataContainer.value = {
                        callback: data.onStart.toString(),
                        execAsyncID: execAsyncID
                    };

                    this.callbacks[execAsyncID] = data.onComplete;
                } else {
                    dataContainer.value = data;
                }

                return dataContainer;
            }
        }, {
            key: "createWorker",
            value: function createWorker( /*str*/workerSource, /*str||undef*/id) {
                var workerID = id || this.randString("worker");

                if (typeof workerSource == "function") {
                    workerSource = this.wrapSource(workerSource);
                }

                var worker = new window.Worker(window.URL.createObjectURL(new window.Blob([workerSource], { type: "text/javascript" })));

                worker.id = workerID;
                worker.onmessage = this.onWorkerMessage;
                worker.onerror = this.onWorkerError;

                return worker;
            }
        }, {
            key: "createExtraWorker",
            value: function createExtraWorker( /*fun||str*/workerSource, /*fun||undef*/callback) {

                var worker = this.createWorker(workerSource);

                this.customWorkers[workerID] = {
                    worker: worker,
                    callback: callback
                };

                return worker;
            }
        }, {
            key: "onMasterWorkerMessage",
            value: function onMasterWorkerMessage( /*obj*/dataContainer) {
                this.messageHandlers[dataContainer.action] && this.messageHandlers[dataContainer.action].call(this, dataContainer.data);
            }
        }, {
            key: "onWorkerMessage",
            value: function onWorkerMessage( /*window.MessageEvent*/messageEvent) {
                var dataContainer = messageEvent.data;

                if (dataContainer.isMaster) {
                    this.onMasterWorkerMessage(dataContainer);
                    return;
                }

                var workerID = dataContainer.workerID;

                if (this.customWorkers[workerID] && this.customWorkers[workerID].callback) {
                    this.customWorkers[workerID].callback(messageEvent);
                }
            }
        }, {
            key: "onWorkerError",
            value: function onWorkerError() {
                console.warn(arguments);
            }
        }, {
            key: "template",
            value: function template(string, /*obj*/settings) {
                if (!settings) return string;
                var matches = string.match(/\$[^${ ;,]*/g) || [];
                var vars = [];

                for (var a = 0, l = matches.length, name; a < l; a++) {
                    name = matches[a].replace("$", "");
                    if (vars.indexOf(name) < 0) vars.push(name);
                }

                for (var a = 0, l = vars.length; a < l; a++) {
                    string = string.replace(new RegExp("\\$" + vars[a], "g"), typeof settings[vars[a]] == "undefined" ? "" : settings[vars[a]]);
                }

                return string;
            }
        }, {
            key: "randString",
            value: function randString( /*str*/prefix) {
                return [prefix || "", Math.random().toString(32).substring(3, 13)].join("-");
            }
        }, {
            key: "wrapSource",
            value: function wrapSource( /*fun*/workerSource, /*obj*/vars) {
                var strSource = workerSource.toString();
                strSource = (strSource.indexOf("function") == 0 ? "" : "function ") + strSource;
                strSource = this.template(strSource, vars);
                return ["(", strSource, ".call(self))"].join("");
            }
        }, {
            key: "messageHandlers",
            get: function get() {
                return messageHandlers;
            }
        }]);

        return Harmony;
    }();

    ;

    Harmony.prototype.Harmony = Harmony;
    harmony = new Harmony();

    return harmony;
});
