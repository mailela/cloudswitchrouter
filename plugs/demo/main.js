
const CryptoJS = require('crypto-js')
var req = require('request')
var log = require('log4node')
var fs = require('fs')
var path=require('path')
var msg = require(path.join(global.CWD,"core/message.js"));

// 系统配置
const config = {
}
var response, request;
function invoke(args, _response, _request, cfg) {
  response = _response;
  request = _request;
  msg.log(args, cfg);
  response.end(msg.message("Demo"));
}
module.exports = {
  invoke,
}