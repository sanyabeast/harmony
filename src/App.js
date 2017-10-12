"use strict";
define(["./WorkerMaster"], function(Worker){

    class App {
        constructor(){
            this.randomNum = Math.random();
            this.worker = new Worker();
        }
    }

    return App;

});