"use strict";
define(["./Harmony"], function(harmony){

    class App {
        constructor(){
            this.randomNum = Math.random();
            this.harmony = harmony;
            window.harmony = this.harmony;

            // harmony.run(function(data, cb){
            //     setInterval(function(){
            //         cb(Math.random() * Math.random() * Math.random() * Math.random());
            //     }, 1);
            // }, 
            // function(data){testElement.innerText = data})
        }
    }

    return App;

});