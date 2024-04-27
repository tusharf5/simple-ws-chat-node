import {randomUUID} from 'crypto';
const wsConnection = new WebSocket("ws://localhost:8080");

let clientId = "";

wsConnection.addEventListener("open", (event) => {
  // when conn is established, 
  // send a message to server
 
  wsConnection.send(JSON.stringify({
    type:"NEW",
  }))

  process.stdin.on("data", (data) => {
    wsConnection.send(JSON.stringify({
        type:"Message",
        data:data.toString("utf-8"),
        id:clientId
    }));
  })
  
});

// Listen for messages
wsConnection.addEventListener("message", (event) => {
  console.log("Message from server ", event.data);
  const messagePayload = JSON.parse(event.data.toString("utf-8"));


  if(messagePayload.type === "ACCEPT") {
    clientId = messagePayload.id;
    console.log("connection accepted client id %s", clientId);
  }

  if(messagePayload.type === "ASK") {
    console.log("Select a client to talk to:")
    messagePayload.data.forEach(id => {
      console.log(id);
    })
  }

});

// https://github.com/websockets/ws