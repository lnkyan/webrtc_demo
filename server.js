const path = require('path')
const express = require('express')
const {ExpressPeerServer} = require('peer')

const app = express()

// 设置静态资源目录
app.use(express.static(path.join(__dirname, 'client')))

// 开始监听http请求
const server = app.listen(8088, (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log('express启动成功：http://localhost:8088')
    }
})

const peerServer = ExpressPeerServer(server, {
    path: '/live',
    allow_discovery: true,
    generateClientId: () => (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString(36),
})
// API doc: https://github.com/peers/peerjs-server/blob/master/src/api/README.md
app.use(peerServer);

app.use((req, res) => {
    res.sendStatus(404)
})

module.exports = app