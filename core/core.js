var path = require("path");
var fs = require('fs');
function exec(cmd, response, reject) {
    var exec = require("child_process").exec;
    return new Promise(function (resolve, reject) {
        exec(cmd, {
            maxBuffer: 1024 * 2000
        }, function (err, stdout, stderr) {
            if (err) {
                reject(err);
                response.end(err.toString());
            } else if (stderr.lenght > 0) {
                // reject(new Error(stderr.toString()));
                response.end(stderr.toString());
            } else {
                resolve(stdout.toString());
                response.end(stdout.toString());
            }
        });
    });
}
/**
 * NodeJS清除模块缓存
 * @param {*} modulePath 
 */
function cleanCache(modulePath) {
    var module = require.cache[modulePath];
    if (!module) {
        return;
    }

    if (module.parent) {
        module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    require.cache[modulePath] = null;
}
/**
 * @getClientIP
 * @desc 获取用户 ip 地址
 * @param {Object} req - 请求
 */
function clientip(req) {
    return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
        req.connection.remoteAddress || // 判断 connection 的远程 IP
        req.socket.remoteAddress || // 判断后端的 socket 的 IP
        req.connection.socket.remoteAddress;
}

/**
 * 获取随机数
 * @param {*} Min 
 * @param {*} Max 
 */
function random(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}
/**
 * 随机取得数组中的一项
 * @param {*} json 
 */
function randomarr(json) {
    return json[random(0, json.length-1)];
}

// 删除 java 注释 /* */：/\*{1,2}[\s\S]*?\*/
// 删除 java 注释 //：//[\s\S]*?\n
// 删除xml注释：<!-[\s\S]*?-->
// 删除空白行：^\s*\n
function config(_path) {
    var val = fs.readFileSync(_path, "UTF-8")
        .replace("${CUR}", process.cwd())
        .replace("${BIN}", global.BIN)
        .replace("${WEBROOT}", global.WEBROOT)
        .replace(/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, "")
        // .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '')
        // .replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '')
        // .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '')
        .replace(/\\/g, "\/")
        ;
    console.log(val)
    return JSON.parse(val);

}
module.exports = {
    exec,
    clientip,
    cleanCache,
    random,
    randomarr,
    config
}