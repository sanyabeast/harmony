"use strict";
define(["./Harmony"], function(Harmony){

    class App {
        constructor(){
            this.randomNum = Math.random();
            this.harmony = new Harmony();
            window.harmony = this.harmony;
        }
    }

    return App;

});