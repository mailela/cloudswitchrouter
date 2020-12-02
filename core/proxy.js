
var httpProxy = require('http-proxy');
const { debug } = require('request');
var proxy = httpProxy.createProxyServer();
var reqNum = 0; // 缓存目前请求的数量
proxy.on("proxyRes", () => {
    reqNum--;
    console.log("end proxy " + reqNum);
})
proxy.on("proxyReq", () => {
    reqNum++;
    console.log("start proxy " + reqNum);
})

function nginx(request, response, server) {
   
    try{
        console.log(request.url,server)
    }catch(e){
        console.log(err)
    }
  setTimeout(() => {
    proxy.web(request, response, {
        target: server
    }, (e) => {
        console.log("proxy error call back ");
        console.log(e);
    });
  }, 1);
}
module.exports = {
    nginx
}