/**
 * 拍照速算识别 WebAPI 接口调用示例
 * 运行前：请先填写Appid、APIKey、APISecret
 * 
 * 1.接口文档（必看）：https://www.xfyun.cn/doc/words/photo-calculate-recg/API.html
 * 2.错误码链接：https://www.xfyun.cn/document/error-code （错误码code为5位数字）
 * @author iflytek
 */

const CryptoJS = require('crypto-js')
var req = require('request')
var log = require('log4node')
var fs = require('fs')
var msg = require(path.join(global.CWD,"core/message.js"));
// 系统配置
const config = {
  // 请求地址
  hostUrl: "https://rest-api.xfyun.cn/v2/itr",
  host: "rest-api.xfyun.cn",
  //在控制台-我的应用-拍照速算获取
  appid: "5c8b011d",
  //在控制台-我的应用-拍照速算获取
  apiSecret: "9ddc18bad675c22807e4003949d4567e",
  //在控制台-我的应用-拍照速算获取
  apiKey: "9b31a64e46a9cdc1fe914ffcfdea9850",
  uri: "/v2/itr",
  file: "./plugs/ocr/itr_jpg.jpg"
}
var response, request;
function invoke(args, _response, _request, cfg) {
  response = _response;
  request = _request;
  let date = (new Date().toUTCString()) // 获取当前时间 RFC1123格式
  let postBody = getPostBody()
  let digest = getDigest(postBody)

  let options = {
    url: config.hostUrl,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json,version=1.0',
      'Host': config.host,
      'Date': date,
      'Digest': digest,
      'Authorization': getAuthStr(date, digest)
    },
    json: true,
    body: postBody
  }

  req.post(options, (err, resp, body) => {
    if (err) {
      log.error("调用失败！请根据错误信息检查代码，接口文档：https://www.xfyun.cn/doc/words/photo-calculate-recg/API.html")
    }
    if (body.code != 0) {
      //以下仅用于调试
      log.error(`发生错误，错误码：${body.code}错误原因：${body.message}`)
      log.error(`请前往https://www.xfyun.cn/document/error-code?code=${body.code}查询解决办法`)
    }
    log.info(`sid：${body.sid}`)
    log.info(`【ITR WebAPI 接口调用结果】`)
    //   log.info(body.data)
    response.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' });
    response.end(JSON.stringify(body.data));
  })
}

// 生成请求body
function getPostBody() {
  let buffer = fs.readFileSync(config.file)
  let digestObj = {
    "common": {
      "app_id": config.appid
    },
    "business": {
      "ent": "math-arith",
      "aue": "raw"
    },
    "data": {
      "image": buffer.toString('base64')
    }
  }
  return digestObj
}

// 请求获取请求体签名
function getDigest(body) {
  return 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)))
}

// 鉴权签名
function getAuthStr(date, digest) {
  let signatureOrigin = `host: ${config.host}\ndate: ${date}\nPOST ${config.uri} HTTP/1.1\ndigest: ${digest}`
  let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
  let signature = CryptoJS.enc.Base64.stringify(signatureSha)
  let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`
  return authorizationOrigin
}
module.exports = {
  invoke,
}