import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const wss = new WebSocketServer({
  port: 8080,
});

const clients = [];

// callback for every new connection
wss.on('connection', function connection(conn) {
  console.log("got a connection request");

  // conn is the connected socket from a connection
  conn.on('error', console.error);

  conn.on('message', function message(data) {
    const messagePayload = JSON.parse(data.toString("utf-8"));
    console.log('received: %s', messagePayload);

    if (messagePayload.type === "NEW") {
      const clientId = randomUUID();

      clients.push({ id: clientId, ws: conn });

      conn.send(JSON.stringify({ id: clientId, type: "ACCEPT" }));
      conn.send(JSON.stringify({
        data: clients.
          map(client => client.id)
          .filter(id => id !== clientId),
        type: "ASK"
      }));

    }

    if (messagePayload.type === "JOIN") {

      const recipientId = messagePayload.recipientId;
      const clientId = messagePayload.clientId;

      conn.send(JSON.stringify({
        type: "JOINED",
        recipientId: recipientId,
      }));

    }

    if (messagePayload.type === "Message") {

      const clientId = messagePayload.clientId;
      console.log(messagePayload.recipientId);
      const recipient =  clients.find((client) => client.id === messagePayload.recipientId.replace("\n", ""));

      const message = messagePayload.message;

      recipient.ws.send(JSON.stringify({
        type: "Message",
        message: message,
        recipientId: clientId,
      }))

    }


  });


});