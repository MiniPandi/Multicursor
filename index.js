const ws = require('ws')
const express = require('express')

const app = express()
app.use(express.static('web'))

const wss = new ws.Server({ port: 8080 })

const users = []

wss.on('connection', function connection(ws) {
    setUser((users.lenght || 0) + 1,ws,ws.url)
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({ type:"add", id:getUser(ws,ws.url) }));
            }
        })
    ws.on('close', function close() {
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({ type:"remove", id:getUser(ws,ws.url) }));
            }
        })
        removeUser(ws,ws.url)
    })
    ws.on('message', function incoming(m) {
        try {
            var message = JSON.parse(m)
            if (message.ping) {
                const pingTime = message.ping;
                ws.send(JSON.stringify({ pong: pingTime }));
                return;
            }
            if (!message.x || !message.y || !message.width || !message.height) return
            const x = message.x;
            const y = message.y;
            const width = message.width;
            const height = message.height;
            const xPer = (x/width) * 100
            const yPer = (y/height) * 100

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({ type:"update", x:xPer, y:yPer, id:getUser(ws,ws.url) }));
                }
            })
        } catch (error) {}
    })
})
function setUser(id,ws,url){
    if(!users[url]) users[url] = {}
    users[url][ws] = {id}
}
function removeUser(ws,url){
    if(!users[url]) users[url] = {}
    delete users[url][ws]
}
function getUser(ws,url){
    if(!users[url]) users[url] = {}
    if (!users[url][ws]) return null
    return users[url][ws].id
}

app.listen(3490)