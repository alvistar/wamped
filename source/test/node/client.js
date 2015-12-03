#!/usr/bin/env node

var autobahn = require ('autobahn');

var connection = new autobahn.Connection({
    url: 'ws://demo.crossbar.io:8080/',
    realm: 'realm1'
});

function onevent(args) {
    console.log("Event:", args[0]);
}

connection.onopen = function (session) {
    console.log("Session connected");
    session.subscribe("com.freedom.welcome", onevent);
    counter = 0;
    setInterval(function(){
        console.log("Publishing to com.freedom.counter - ", counter);
        session.publish("com.freedom.oncounter", [counter]);
        counter++;
    }, 1000);
}



connection.open();