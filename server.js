const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const bodyParser = require('body-parser')
const rooms = {}
const messages = {}
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(bodyParser.json())
app.get('/', (req, res) => {
  res.send('<h1>This is a server</h1>');
});
app.post('/fetchroom', (req, res) => {
  const room = req.body.room
  const username = req.body.username
  var userExist = false
  if (rooms[room] !== undefined) {
    userExist = Object.values(rooms[room]).indexOf(username) > -1
  }
 
  console.log(userExist)
  res.send(userExist);
});
io.on('connection', (socket) => {
  //join a room
    socket.on('joinRoom', (params) => {
      const room = params.room;
      const user = params.username;
      socket.join(room);
      const socketId = socket.id
      console.log('connected')
     
      if (rooms.hasOwnProperty(room) === false) rooms[room] = {}
      
      rooms[room][socketId] = user
      io.in(room).emit('userConnect', user);
      console.log(rooms)
      io.sockets.emit('getRoomList', rooms)
      io.in(room).emit('getUsers', rooms[room]);

    });
  
    //get room
    socket.emit('getRoomList', rooms);

    //disconnect a room
    socket.on('disconnect', () => {
      const socketId = socket.id;
      const room = getKeyByValue(rooms,socketId)
      console.log('disconnected')
     
      if (rooms[room] !== undefined) {
        const user = rooms[room][socketId];
        delete rooms[room][socketId];
       
        socket.to(room).emit('getUsers', rooms[room]);
        if(Object.keys(rooms[room]).length === 0) {
          delete rooms[room]
        } else {
          io.in(room).emit('userDisconnect', user);
        }
      }
      console.log(rooms[room])
      io.sockets.emit('getRoomList', rooms)
     
    });
    socket.on('sendMessage',(params) => {
      const user = params.currentUser
      const room = params.roomname
      const message = params.inputMessage
      socket.to(room).emit('getMessage', ({user, message}));
    
    });
});
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => { 
    if (value in object[key]) {
      return key
    }
  });
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});