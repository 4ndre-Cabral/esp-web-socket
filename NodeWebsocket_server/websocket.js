const express = require('express');
const app = express();
app.use(express.static('public'))
var WebSocketServer = require('websocket').server;
var http = require('http');

//Porta que o server irá escutar
const port = 8080;

//Cria o server
var server = http.createServer(app);
var esp_client
var clients = []

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

//Server irá escutar na porta definida em 'port'
server.listen(port, () => {
  //Server está pronto
  console.log(`Server está executando na porta ${port}`);
});

//Cria o WebSocket server
wsServer = new WebSocketServer({
  httpServer: server
});

//Chamado quando um client deseja conectar
wsServer.on('request', (request) => {

  //Aceita a conexão do client
  let connection = request.accept(null, request.origin);
  clients.push(connection)
  if (request.origin === 'https://github.com/gilmaimon/TinyWebsockets') {
    esp_client = connection
  }

  //Chamado quando o client envia uma mensagem
  connection.on('message', (message) => {
    //Se é uma mensagem string utf8
    if (message.type === 'utf8') {
      //Mostra no console a mensagem
      // Broadcast the message to all the clients
      clients.forEach(client => {
        client.sendUTF(message.utf8Data)
      })
      console.log(message.utf8Data)
    }
  });

  //Chamado quando a conexão com o client é fechada
  connection.on('close', () => {
    console.log('Conexão fechada')
    if (esp_client) {
      let item = clients.findIndex(c => c.remoteAddress = esp_client.remoteAddress && c.state === 'closed')
      if (item !== null || item !== undefined) {
        console.log('esp_closed')
        esp_client = null
        clients.splice(item, 1)
        clients.forEach(client => {
          client.sendUTF('esp_closed')
        })
      }
    }
  })
})
//Verifica se clientes estão conectados
setInterval(function ping() {
  clients.forEach(client => {
    client.ping()
  })
}, 500)
//Sinaliza para o front que o ESP está conectado
setInterval(() => {
  if (esp_client && esp_client.state === 'open')  {
    clients.forEach(client => {
      client.sendUTF('hello_from_esp')
    })
  }
}, 5000)