window.log = console.log.bind(console);

requirejs.config({
    paths : {
        postal : "../node_modules/postal/postal"
    }
});

requirejs(["App"], function(App){
    window.app = new App();

});
