
var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
querystring = require("querystring");
var path = require("path");
var msg = require(path.join(__dirname, "/core/message"));
var core = require(path.join(__dirname, "/core/core"));
var proxy = require(path.join(__dirname, "/core/proxy"));
var colors = require("colors");
var yargs = require('yargs')
const { debug } = require('console');
var cfg;//服务器配置文件


// //命令行参数
var argvs = yargs
    .option('sslport', {
        alias: 'sslport',
        demand: false,
        default: "",
        describe: 'Server SSL Port',
        type: 'string'
    })
    .option('port', {
        alias: 'port',
        demand: false,
        default: "",
        describe: 'Server Port',
        type: 'string'
    })
    .option('config', {
        alias: 'config',
        demand: false,
        default: "server.cfg.json",
        describe: 'Server Port',
        type: 'string'
    })
    .argv;

cfg = core.config(path.join(process.cwd(), argvs.config));//加载配置文件

cfg.server.ssl.port = argvs.sslport || cfg.server.ssl.port;
cfg.server.port = argvs.port || cfg.server.port;

// cfg = core.config(path.join(process.cwd(), "server.cfg"));//加载配置文件

let port = cfg.server.port || 80;//监听端口
let sslport = cfg.server.ssl.port || 443;//监听端口ssl

let ip = cfg.server.ip || "0.0.0.0";//监听端口
let plugpath = cfg.server.plugpath || "/plugs/";//插件目录
//全局变量
global.ISDEBUG = cfg.debug || false;
global.WEBROOT = cfg.server.webroot || path.join(process.cwd(), "/web/")
global.config = cfg;//全局配置
global.BIN = path.join(process.cwd(), "commands/");//命令目录
global.CWD = (__dirname == "") ? path.join(process.cwd(), "/") : path.join(__dirname, "/");//Core目录
global.Headers = cfg.server.headers || { "ServerName": "CloudSwitch Router" };

// msg.debug(argvs, cfg);



//创建服务器
var app = http.createServer(function (request, response) {
    main(request, response);
});

// https server,证书路径
let options = [];
if (fs.existsSync(cfg.server.ssl.key) && fs.existsSync(cfg.server.ssl.cert)) {
    options = {
        key: fs.readFileSync(cfg.server.ssl.key),//Key密钥
        cert: fs.readFileSync(cfg.server.ssl.cert)//PEM证书
    }
}
//创建SSL服务器
var appssl = https.createServer(options, function (request, response) {
    main(request, response);
});

process.on('uncaughtException', function (err) {
    //打印出错误
    msg.log(err.toString().red);
    //打印出错误的调用栈方便调试
    msg.debug(err.stack);
});
try {
    console.log(`Wellcom to ${global.Headers.ServerName}`.rainbow)
    app.listen(port, ip);
    console.log(`${global.Headers.ServerName} running at http://${ip}:${port}/`.green);
    if (cfg.server.ssl.enable) {
        appssl.listen(sslport, ip);
        console.log(`${global.Headers.ServerName} SSL running at http://${cfg.server.ssl.ip}:${cfg.server.ssl.port}/`.green);
    }
} catch (e) {
    // msg.log(`Server can't run at ${ip}:${port}`);
    msg.debug(e.toString());
}


//动态脚本处理
function getScript(pathname, response) {

    var ext = path.extname(pathname);
    for (var key in cfg.scripts) {
        if (key == ext) {
            var cmd = cfg.scripts[key].cgi + " " + path.join(global.WEBROOT, pathname);
            // console.log(cmd);
            core.exec(cmd, response);
            return;
        }
    }
    //从文件系统中都去请求的文件内容
    fs.readFile(path.join(global.WEBROOT, pathname), (err, data) => {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            msg.debug(404, "Resource is not found!")
            response.end()
            return;
        }
        response.end(data);
    });

}

function main(request, response) {

    // 日志配置
    exports.configure = function () {
        log4js.configure(path.join(process.cwd(), "log.cfg"));
    }

    for (var key in global.Headers) {
        response.setHeader(key, global.Headers[key])
    }
    response.setHeader("Content-Type", "charset=utf-8");
    response.setHeader("X-PowerBy", "HkingSoft");


    if (cfg.proxy.enable) {
        proxy.nginx(request, response, core.randomarr(cfg.proxy.servers).server)
        return;
    }
    args = url.parse(request.url, true).query
    msg.debug("GET", request.headers, args)//调试
    if (request.method == "POST") {
        var postData = ""; //POST & GET ： name=zzl&email=zzl@sina.com
        // 数据块接收中
        request.on("data", function (postDataChunk) {
            postData += postDataChunk;
        });
        // 数据接收完毕，执行回调函数
        request.on("end", function () {
            msg.debug("POST1", args)//调试
            if (postData != "") {
                args = querystring.parse(postData);  //GET & POST 
            }
            msg.debug("POST2", args)//调试
        });
    }

    var clientip = core.clientip(request);
    var isAuth = false;//允许访问
    var isPlugs = false;//允许访问

    //解析请求，包括文件名
    var pathname = url.parse(request.url).pathname;
    //输出请求的文件名
    msg.log("Request for ".green + pathname.yellow + " received from ".green + "[".blue + clientip + "]".blue);
    act = pathname.substr(1, pathname.length - 1);





    fs.exists(path.join(global.WEBROOT, pathname), function (exists) {
        if (exists) {
            getScript(pathname, response);//访问WEB
        } else {
            //权限认证
            __user = request.headers["x-user"] || args.user;
            __password = request.headers["x-password"] || args.password;
            msg.debug("USER:", __user, "PASSWORD:", __password)
            for (var key in cfg["users"]) {
                var username = cfg["users"][key]["username"];//帐号
                var password = cfg["users"][key]["password"];//密码
                var services = cfg["users"][key]["services"] || "";//可开启服务
                var iplist = cfg["users"][key]["iplist"] || "";//IP白名单模式
                if (__user == username && __password == password) {
                    // msg.log(services, act, services.includes(act));
                    isAuth = true;
                    if (!services.includes(act) && !services.includes("*")) {
                        response.end(msg.format(500, "Hi " + username + ",Permission validation failed  To  " + act + " Services!", services));
                        return;
                    }
                    if (!iplist.includes(clientip) && iplist != "" && !iplist.includes("*")) {
                        response.end(msg.format(500, "Hi " + username + ",This IP " + clientip + " not Allow allowed access  " + act + " Services!", services));
                        return;
                    }
                    break;
                }
            }

            if (isAuth == false && path.extname(pathname) == "") {
                response.end(msg.error("Permission validation failed  To  " + act + " Services!"));
                return;
            }

            try {

                // 加载插件和配置
                let plug_path = path.join(__dirname, plugpath, act, "/main.js");//插件目录
                let plug_config_path = path.join(process.cwd(), "/configs/" + act + "/config.cfg");//插件配置目录
                msg.debug(args);

                if (path.extname(pathname) == "") {
                   
                    // console.log(plug_path.red);
                    //不存就加载插件内置插件
                    if (!fs.existsSync(plug_path)) {
                        msg.log("load plugin ..." + act);
                        let _plug_path = path.join(process.cwd(), plugpath, act, "/main.js");//文件插件目录
                        plug_path = _plug_path;
                    }
                    // console.log(plug_path.red);
                    //加载配置文件插件目录
                    if (fs.existsSync(plug_path)) {
                        let cfg = [];
                        if (fs.existsSync(plug_config_path)) {
                            cfg = core.config(plug_config_path);//加载插件配置
                        }
                        msg.debug(plug_path,plug_config_path)
                        // if (global.ISDEBUG) { core.cleanCache(plug_path); }
                        var plug = require(plug_path);//加载插件
                        plug.invoke(args, response, request, cfg);
                    } else {
                        response.end(msg.error(act + " Services not Exists!"));
                    }
                } else {
                    response.end(msg.format(404, "Resource is not found!"))
                }

            } catch (err) {
                msg.error(err.toString());
                msg.debug(err.stack)
                response.end(msg.format(404, "Resource is not found!"))
            }
        }
    });

}

