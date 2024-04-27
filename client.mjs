import {randomUUID} from 'crypto';
const wsConnection = new WebSocket("ws://localhost:8080");

let clientId = "";

wsConnection.addEventListener("open", (event) => {
  // when conn is established, 
  // send a message to server
 
  wsConnection.send(JSON.stringify({
    type:"NEW",
  }))

  
});

// Listen for messages
wsConnection.addEventListener("message", (event) => {
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

    process.stdin.once("data", (data) => {
      if(data.toString("utf-8").replace("\n", "") === "") {
        console.log("no client selected");
        return;
      }
      wsConnection.send(JSON.stringify({
          type:"JOIN",
          recipientId: data.toString("utf-8"),
          clientId: clientId
      }));
    })
  }

  if(messagePayload.type === "JOINED") {
    console.log("You are not chatting with %s", messagePayload.recipientId);
    process.stdin.write(`YOU > `)
    process.stdin.on("data", (data) => {
      wsConnection.send(JSON.stringify({
          type:"Message",
          message: data.toString("utf-8"),
          clientId: clientId,
          recipientId: messagePayload.recipientId,
      }));
    })
  }

  if(messagePayload.type === "Message") {
    console.log("\n%s > %s", messagePayload.recipientId, messagePayload.message);
    process.stdin.write(`YOU > `)
  }

});

// https://github.com/websockets/ws