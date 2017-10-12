"use strict";
define(["./Harmony"], function(Harmony){

    class App {
        constructor(){
            this.randomNum = Math.random();
            this.harmony = new Harmony();
            window.harmony = this.harmony;

            harmony.run(function(data, cb){
                setInterval(function(){
                    cb(Math.random() * Math.random() * Math.random() * Math.random());
                }, 1);
            }, 
            function(data){testElement.innerText = data})
        }
    }

    return App;

});