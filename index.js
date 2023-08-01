const { createServer } = require('http')
const { writeFile, readFile } = require('fs').promises
const { Server: WSServer } = require('./ws-mod.min.js')
const port = 1234
const server = createServer(handleServer)
const wsServer = new WSServer({ server })
const wsConnections = new Set()
const styles = getCSS()
const script = handleClient.toString().replace(`function ${handleClient.name}()`, '')

let count = 25
let indexJS

readFile('index.js', 'utf8').then(data => indexJS = data)


wsServer.on('connection', handleConnect)

server.listen(port, () => console.log(`counter UI is at http://localhost:${port}`))

function handleConnect(ws) {
  ws.on('message', handleMessage)
  ws.on('close', () => wsConnections.delete(ws))
  ws.send(`count = ${count}`)
  wsConnections.add(global.ws = ws)
}

function handleMessage(data) {
  if (data == 'increment') {
    count++
    saveCount()
    broadcastNewCount()
  } else if (data == 'decrement') {
    count--
    if (count < 0) count = 0
    saveCount()
    broadcastNewCount()
  }
}

function saveCount() {
  writeFile('index.js', indexJS.replace(/let count = \d+/, `let count = ${count}`))
}

function broadcastNewCount() {
  wsConnections.forEach(ws => ws.send(`count = ${count}`))
}

function handleServer(request, response) {
  const { url } = request

  if (url.startsWith('/api/')) {
    const endpoint = url.replace('/api/', '')

    if (endpoint == 'increment') {
      count++
      saveCount()
      broadcastNewCount()
    } else if (endpoint == 'decrement') {
      count--
      if (count < 0) count = 0
      saveCount()
      broadcastNewCount()
    }

    response.end(`count = ${count}`)
  } else {
    response.end(buildPage())
  }
}

function buildPage() {
  return `
    <head>
      <meta charset="UTF-8"><head>
      <link rel="icon" href="data:"></link>
      <style>${styles}</style>
    </head>
    <body>
      ${buildBody()}
      <script>${script}</script>
    </body>
  `
}

function getCSS() {
  return `
    #counter {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
    }
  `
}

function buildBody() {
  return `
    <div id="counter">
      <button id="incrementBtn">▲</button>
      <h1 id="count">${count}</h1>
      <button id="decrementBtn">▼</button>
    </div>
  `
}

function handleClient() {
  let ws
  
  connectWS()

  incrementBtn.onclick = () => ws.send('increment')
  decrementBtn.onclick = () => ws.send('decrement')

  function connectWS() {
    ws = new WebSocket('ws://localhost:1234')

    ws.onmessage = ({ data }) => {
      if (data.startsWith('count = ')) count.innerText = data.replace('count = ', '')
    }

    ws.onopen = () => {
      console.log('connected')
      incrementBtn.disabled = decrementBtn.disabled = false
    }

    ws.onclose = () => {
      window.downCount = (window.downCount || 0) + 1
      console.log(`disconnected ${downCount}...`)
      incrementBtn.disabled = decrementBtn.disabled = true
      setTimeout(connectWS, 10e3)
    }
  }
}
