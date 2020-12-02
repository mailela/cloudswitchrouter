
const CryptoJS = require('crypto-js')
var req = require('request')
var log = require('log4node')
var fs = require('fs')
var msg = require(path.join(global.CWD,"core/message.js"));
var path = require("path");
// 系统配置
const config = {
}
var response, request;
function invoke(args, _response, _request, cfg) {
  response = _response;
  request = _request;
  msg.log(args, cfg);
  if (!args.command) {
    response.end(msg.error("Missing parameter:command"));
    return;
  }
  args.command = args.command.replace(/&/, "").replace(/\|/, "");
  exec(path.join(global.BIN, args.command));
}

function exec(cmd) {
  var exec = require("child_process").exec;
  return new Promise(function (resolve, reject) {
    msg.log(cmd);
    exec(cmd, {
      maxBuffer: 1024 * 2000
    }, function (err, stdout, stderr) {
      if (err) {
        if (global.ISDEBUG) {
          response.end(msg.error(err.toString()));
        } else {
          response.end("Execute Error");
        }
        reject(err);
      } else if (stderr.lenght > 0) {
        reject(new Error(stderr.toString()));
        if (global.ISDEBUG) {
          response.end(msg.error(stderr.toString()));
        } else {
          response.end(msg.error("Execute Error"));
        }
      } else {
        response.end(msg.message(stdout.toString()));
        resolve();
      }
    });
  });
}
module.exports = {
  invoke,
}