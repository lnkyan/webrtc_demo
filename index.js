const express = require('express');
const {ExpressPeerServer} = require('peer');

const app = express();

// 设置静态资源目录
app.use(express.static(__dirname));

// 开始监听http请求
const server = app.listen(8088, (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log('express启动成功');
    }
});

const peerServer = ExpressPeerServer(server, {path: '/live'});
app.use(peerServer);

app.use((req, res) => {
    res.sendStatus(404);
});

module.exports = app;