const CryptoJS = require('crypto-js')
// 系统配置 
const config = {
    // 请求地址
    hostUrl: "wss://tts-api.xfyun.cn/v2/tts",
    host: "tts-api.xfyun.cn",

    appid: "",
    apiSecret: "",
    apiKey: "",

    text: "",//要合成的文本
    uri: "/v2/tts",
}
const WebSocket = require('ws');
var md5 = require('md5-node');
var path = require("path");
var log = require('log4node');
var fs = require('fs');
var msg = require(path.join(global.CWD, "core/message.js"));
var core = require(path.join(global.CWD, "core/core.js"));
var ws;
var tts_path = path.join(global.WEBROOT, "/voice/");
var response;
var colors = require("colors");
var ffmpeg = "ffmpeg";
function invoke(args, _response, _request, cfg) {
    response = _response;
    var text = args.text
    if (text == "" || text == undefined) {

        response.end(msg.message("Missing parameter:text"));
        return;
    }
    var _cfg = core.randomarr(cfg["Apps"]);
    tts_path = cfg.voicepath.replace("${WEBROOT}", global.WEBROOT) || tts_path;
    ffmpeg = cfg.ffmpeg.replace("${CUR}", process.cwd()) || ffmpeg;
    config.appid = _cfg.appid;
    config.apiSecret = _cfg.apiSecret;
    config.apiKey = _cfg.apiKey;

    // 获取当前时间 RFC1123格式
    let date = (new Date().toUTCString())
    // 设置当前临时状态为初始化
    let wssUrl = config.hostUrl + "?authorization=" + getAuthStr(date) + "&date=" + date + "&host=" + config.host


    msg.log(config);

    var ttsfilename = "";
    msg.log("start tts".green);
    ttsfilename = md5(text) + ".pcm";
    config.text = text;

    // 如果之前保存过音频文件，直接输出
    if (fs.existsSync(tts_path + ttsfilename)) {
        if (fs.exists(tts_path + ttsfilename + ".mp3", function (exists) {
            if (exists) {
                outputstream(tts_path + ttsfilename + ".mp3")
            }
            else {
                convert(tts_path + ttsfilename);
            }
        }));


        return;
    }


    try {
        ws = new WebSocket(wssUrl)
    } catch (e) {
        msg.log(e);
        response.end(msg.error("WebSocket error!"+e.toString()));
        return;
    }

    // msg.log(ttsfilename,config);
    // 连接建立完毕，读取数据进行识别
    ws.on('open', (data, err) => {
        msg.message("websocket connect!")
        if (err) {
            response.end(msg.error('message error: ' + err));
            return
        }
        send();

    })

    // 得到结果后进行处理，仅供参考，具体业务具体对待
    ws.on('message', (data, err) => {
        if (err) {
            response.end(msg.error('message error: ' + err));
            return
        }

        let res = JSON.parse(data)

        if (res.code != 0) {
            ws.close()
            response.end(msg.error(`${res.code}: ${res.message}`));
            // response.end(`${res.code}: ${res.message}`);
            return
        }

        let audio = res.data.audio
        //  save(audio,ttsfilename);
        let audioBuf = Buffer.from(audio, 'base64')
        // outputstream(audio);
        save(audioBuf, ttsfilename);
        // msg.log(audioBuf);


        if (res.code == 0 && res.data.status == 2) {
            ws.close()
            convert(tts_path + ttsfilename);
            msg.message(`文件保存成功${ttsfilename}`)
        }

    })

    // 资源释放
    ws.on('close', () => {
        msg.message('connect close!')
    })

    // 连接错误
    ws.on('error', (err) => {
        response.end(msg.error("websocket connect err: " + err));
        return;
    })
    return JSON.stringify({ "id": ttsfilename });
}

// 鉴权签名
function getAuthStr(date) {
    let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
    let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
    let signature = CryptoJS.enc.Base64.stringify(signatureSha)
    let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
    return authStr
}

// 传输数据
function send() {
    let frame = {
        // 填充common
        "common": {
            "app_id": config.appid
        },
        // 填充business
        "business": {
            "aue": "raw",
            "auf": "audio/L16;rate=16000",
            "vcn": "xiaoyan",
            "tte": "UTF8"
        },
        // 填充data
        "data": {
            "text": Buffer.from(config.text).toString('base64'),
            "status": 2
        }
    }
    ws.send(JSON.stringify(frame))
}

// 保存文件
function save(data, filename) {
    fs.access(tts_path, err => {
        if (err) {
            fs.mkdir(tts_path,function(){
                msg.message(`{$tts_path} create ok!`);
            });
            response.end(msg.error(`Please confirm the directory ${tts_path} exists!`));
            return 1;
        }
    });
    fs.writeFile(tts_path + filename, data, { flag: 'a' }, (err) => {
        if (err) {
            msg.error('save error: ' + filename + err)
            return
        }

    })
}
function convert(filename) {
    // ffmpeg -y -f s16le -ac 1 -ar 16000 -acodec pcm_s16le -i test.pcm test.mp3
    var output = filename + ".mp3";
    if (!fs.existsSync(filename)) {
        // response.end("convert fail");
        return;
    }
    var exec = require("child_process").exec;
    return new Promise(function (resolve, reject) {
        var cmd = ffmpeg + ' -y -f s16le -ac 1 -ar 16000 -acodec pcm_s16le -i "' + filename + '" "' + output + '"';
        msg.log(cmd);
        exec(cmd, {
            maxBuffer: 1024 * 2000
        }, function (err, stdout, stderr) {
            if (err) {
                msg.log(err);
                reject(err);
                response.end(msg.error(err.toString()));
            } else if (stderr.lenght > 0) {
                // reject(new Error(stderr.toString()));
                msg.log(stderr.toString());
                response.end(msg.error(stderr.toString()));
            } else {
                msg.log(stdout);
                outputstream(output);
                resolve();
            }


        });
    });
}
function outputstream(filename) {

    fs.readFile(filename, (err, data) => {
        // msg.log(data);
        try { response.setHeader('Content-Type', 'audio/mpeg'); } catch (e) { }
        response.end(data);
        msg.log(`tts ok${filename}`.green);
    });
    //      try{ response.setHeader('Content-Type','audio/mpeg');}catch(e){}
    //   response.end(filename.substr(1,filename.length-1));

}
module.exports = {
    invoke,
}