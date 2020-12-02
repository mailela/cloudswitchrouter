var path = require("path");
var fs = require('fs');
var colors = require('colors');


//bold
//italic
//underline
//inverse
//yellow
//cyan
//white
//magenta
//green
//red
//grey
//blue
//rainbow
//zebra
//inverse

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'red',
    info: 'green',
    data: 'blue',
    help: 'cyan',
    warn: 'yellow',
    debug: 'inverse',
    tag:'magenta',
    error: 'red'
});


function error(message) {
    console.log(`500`.tag, message.info);
    return format(500, message, "");
}
function message(message) {
    console.log(`200`.tag, message.error);
    return format(200, message, "");
}
function format(code, message, data) {

    if (data) {
        console.log(`${code}`.yellow, message.green, data);
        return JSON.stringify({
            "code": code,
            "message": message,
            "data": data
        })

    }
    return JSON.stringify({
        "code": code,
        "message": message
    })
}
function log() {
    for (var o in arguments) {
        console.log(arguments[o])
    }
}
function debug() {
    if (global.ISDEBUG) {
        for (var o in arguments) {
            if(typeof(arguments[o]) ==="string"){
                console.log(arguments[o].debug)
            }else{
                console.log(arguments[o])
            }
        }
    }
}
module.exports = {
    log,
    error,
    message,
    format,
    debug,
}