// import Peer from 'peerjs'
// doc https://peerjs.com/docs.html#api

class p2pNode {
    constructor(config) {
        this.peerId = config.peerId
        this.localVideoDom = config.localVideoDom
        this.remoteVideoDom = config.remoteVideoDom
        this.dataListener = config.onReceiveData

        // 连接列表，key是节点id，value是{connection, peer, call}对象
        this.connections = {}
        this.peer = null
        this.localStream = null
    }

    start() {
        this.peer = new Peer(this.peerId, {
            host: location.hostname,
            port: location.port,
            path: '/live',
        });
        this.peer.on('open', function(id) {
            console.log('WebRTC启动成功，id为:', id);
        });

        this.peer.on('connection', (connection) => {
            console.log(`收到[${connection.peer}]节点的连接请求`);
            this.handleNewConnection(connection.peer, connection)
        });
        this.peer.on('call', (call) => {
            console.log(`收到[${call.peer}]节点的视频请求`, call)
            this.handleNewCall(call.peer, call)
        })
    }

    getConnectionIds() {
        return Object.keys(this.connections)
    }

    connect(peerId) {
        const connection = this.peer.connect(peerId);
        this.handleNewConnection(peerId, connection)
    }

    handleNewConnection(peerId, connection) {
        connection.on('open', () => {
            console.log(`[${peerId}]节点连接成功`);
            if (!this.connections[peerId]) {
                this.connections[peerId] = {}
            }
            this.connections[peerId].connection = connection
        });
        connection.on('data', data => {
            if (this.dataListener) {
                this.dataListener(data)
            }
        });
    }

    sendText(peerId, msg) {
        if (!this.connections[peerId] || !this.connections[peerId].connection) {
            throw new Error(`target peer "${peerId}" dose not exist`)
        }

        this.connections[peerId].connection.send(msg);
    }

    async openScreen() {
        try {
            if (navigator.mediaDevices.getDisplayMedia) {
                // w3c
                this.localStream = await navigator.mediaDevices.getDisplayMedia({video: true})
            } else {
                // firefox
                this.localStream = await navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}, audio: true})
            }
            if (this.localVideoDom) {
                this.localVideoDom.srcObject = this.localStream
            }
            console.log('开启桌面共享')
        } catch (error) {
            console.error('Failed to get local stream', error);
        }
    }

    async openCamera() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})

            if (this.localVideoDom) {
                this.localVideoDom.srcObject = this.localStream
            }
            console.log('开启摄像头')
        } catch (error) {
            console.error('摄像头开启失败', error.name, error);
            switch (error.name) {
                case 'NotAllowedError': // 用户禁用权限（chrome）
                case 'PermissionDeniedError':
                case 'NotFoundError': // 用户禁用权限（QQ浏览器），禁用设备（所有浏览器）
                case 'DevicesNotFoundError':
                    alert('没有安装摄像头或摄像头权限已被禁止')
                    break
                case 'NotReadableError':
                case 'TrackStartError':
                    alert('摄像头被其他程序占用，请关闭占用的程序')
                    break
                case 'OverconstrainedError':
                case 'ConstraintNotSatisfiedErrror':
                    alert('摄像头不支持的分辨率')
                    break
                case 'TypeError':
                    alert('摄像头开启参数配置错误')
                    break
            }
        }
    }

    call(peerId) {
        console.log('开始推送视频流')
        if (!this.localStream) {
            throw new Error('no local video stream')
        }

        const call = this.peer.call(peerId, this.localStream);
        this.handleNewCall(peerId, call)
    }

    handleNewCall(peerId, call) {
        if (!this.connections[peerId]) {
            this.connections[peerId] = {}
        }
        this.connections[peerId].call = call
        call.on('stream', remoteStream => {
            console.log('收到视频流')
            if (this.remoteVideoDom) {
                this.remoteVideoDom.srcObject = remoteStream
            }
        });

        if (this.localStream) {
            call.answer(this.localStream)
        } else {
            call.answer()
        }
    }
}