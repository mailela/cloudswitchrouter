
const CryptoJS = require('crypto-js')
var req = require('request')
var log = require('log4node')
var fs = require('fs')
var path = require('path')
var msg = require(path.join(global.CWD, "core/message.js"));
// 系统配置
const config = {
}
var response, request;
function invoke(args, _response, _request, cfg) {
  response = _response;
  request = _request;
  // msg.log(args, cfg);
  var type = args.type || "file";//file|directory
  var urllist = args.urllist || "";//url list split by [##]

  if (type == "" || type == undefined) {
    response.end(msg.message("Missing parameter:type,value is: file directory "));
    return;
  }
  if (urllist == "" || urllist == undefined) {
    response.end(msg.message("Missing parameter:urllist,value split by [##]"));
    return;
  }
  urllist=urllist.replace(/\|\$\|/g,",");
  console.log(urllist.red);
  var cmd = `/usr/bin/python ${process.cwd()}/plugs/cdn/cdn.py ${type} ${urllist}`

  exec(cmd, response);
}
function exec(cmd, response, reject) {
  var exec = require("child_process").exec;
  return new Promise(function (resolve, reject) {
    exec(cmd, {
      maxBuffer: 1024 * 2000
    }, function (err, stdout, stderr) {
      if (err) {
        // reject(err);
        response.end(msg.error(err.toString()));
      } else if (stderr.lenght > 0) {
        // reject(new Error(stderr.toString()));
        response.end(msg.error(stderr.toString()));
      } else {
        // resolve(stdout.toString());
        response.end(msg.message(stdout.toString()));
      }
    });
  });
}
module.exports = {
  invoke,
}