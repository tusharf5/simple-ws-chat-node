import { randomUUID } from 'crypto';
const wsConnection = new WebSocket("ws://localhost:8080");
import { createInterface } from 'readline';

const rl = createInterface(process.stdin, process.stdout)

let clientId = "";

wsConnection.addEventListener("open", (event) => {

  rl.question("What is your name:", (answer) => {
    wsConnection.send(JSON.stringify({
      type: "NEW",
      clientId: answer.trim(),
    }))
  });

});

// Listen for messages
wsConnection.addEventListener("message", (event) => {
  const messagePayload = JSON.parse(event.data.toString("utf-8"));

  if (messagePayload.type === "ACCEPT") {
    clientId = messagePayload.id;
    console.log("connection accepted client id %s", clientId);
  }

  if (messagePayload.type === "ASK") {
    messagePayload.data.forEach(id => {
      console.log(id);
    })

    rl.question("Select a client to talk to: ", (answer) => {
      if (answer.trim() === "") {
        console.log("no client selected");
        return;
      }
      wsConnection.send(JSON.stringify({
        type: "JOIN",
        recipientId: answer,
        clientId: clientId
      }));
    })
  }

  if (messagePayload.type === "JOINED") {
    console.log("You are not chatting with %s", messagePayload.recipientId);
    process.stdin.write(`YOU > `)
    rl.on("line", (message) => {
      wsConnection.send(JSON.stringify({
        type: "Message",
        message: message.trim(),
        clientId: clientId,
        recipientId: messagePayload.recipientId,
      }));
      process.stdout.write(`YOU > `)
    })
  }

  if (messagePayload.type === "Message") {
    rl.pause();
    const data = rl.line;
    process.stdout.clearLine(0, () => {
      process.stdout.write(`${messagePayload.recipientId} > ${messagePayload.message}\n`)
      process.stdout.write(`YOU > `)
      process.stdin.write(data); // copy the lefover data
      rl.resume();
    });
  }

});
