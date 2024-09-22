const ws = require('ws')
const express = require('express')

const app = express()
app.use(express.static('web'))

const wss = new ws.Server({ port: 8080 })
const rateLimit = 100

const users = []
const rateLimitUsers = []

(async () => {
    setInterval(() => {
        for (const url in rateLimitUsers) {
            for (const ws in rateLimitUsers[url]) {
                rateLimitUsers[url][ws].requests = 0
            }
        }
    }, 1000)
})

wss.on('connection', function connection(ws) {
    setUser((users.lenght || 0) + 1,ws,ws.url)
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({ type:"add", id:getUser(ws,ws.url) }));
            }
        })
    if (users[ws.url]) {
        for (const url in users) {
            for (const ws1 in users[url]) {
              const userId = users[url][ws1].id;
              if (users[url][ws1] && userId) {
                ws.send(JSON.stringify({ type:"add", id:userId }));
              }
            }
          }
    }
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
            rateLimitUsers[ws.url][ws] = {id:getUser(ws,ws.url),requests:rateLimitUsers[ws.url][ws].requests + 1}
            if (rateLimitUsers[ws.url][ws].requests >= rateLimit) {
                return;
            }
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
    if (!rateLimitUsers[url]) rateLimitUsers[url] = {}
    rateLimitUsers[url][ws] = {id:id,requests:0}
}
function removeUser(ws,url){
    if(!users[url]) users[url] = {}
    delete users[url][ws]
    if (!rateLimitUsers[url]) rateLimitUsers[url] = {}
    delete rateLimitUsers[url][ws]
}
function getUser(ws,url){
    if(!users[url]) users[url] = {}
    if (!users[url][ws]) return null
    return users[url][ws].id
}

app.listen(3490, () => {
    console.log('Listening on port 8080 and 3490')
})