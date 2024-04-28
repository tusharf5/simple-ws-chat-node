import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const wss = new WebSocketServer({
  port: 8080,
});

const clientsById = new Map();
const clientsByConn = new WeakMap();
const rooms = new Map();

wss.on('connection', function connection(conn) {
  console.log("got a connection request");

  conn.on('error', console.error);

  conn.on('message', (data) => {
    onMessage(data, conn);
  });

  conn.on("close", () => {
    const clientId = clientsByConn.get(conn);
    const recipient = rooms.get(clientId);
    const recipientConn = clientsById.get(recipient);
    rooms.delete(clientId);
    rooms.delete(recipient);

    clientsById.delete(clientId);

    
    if(recipientConn)
    recipientConn.send(JSON.stringify({
      type: "Message",
      message: "Recipient went offline",
      recipientId: "server",
    }))
  })

});

/**
 * 
 * @param {WebSocket.RawData} message 
 * @param {WebSocket} conn 
 */
function onMessage(data, conn) {

  const messagePayload = JSON.parse(data.toString("utf-8"));

  switch (messagePayload.type) {
    case "NEW": {
      newClient(messagePayload, conn);
      return;
    }
    case "JOIN": {
      joinRoom(messagePayload, conn);
      return;
    }
    case "Message": {
      onChat(messagePayload, conn);
      return;
    }
    default: {
      conn.send(JSON.stringify({
        type: "Message",
        message: "Unknown command",
        recipientId: "server",
      }))
    }
  }
}

/**
 * 
 * @param {any} payload 
 * @param {WebSocket} conn 
 */
function newClient(payload, conn) {
  const clientId = payload.clientId;

  clientsById.set(clientId, conn);
  clientsByConn.set(conn, clientId);

  conn.send(JSON.stringify({ id: clientId, type: "ACCEPT" }));

  conn.send(JSON.stringify({
    data: Array.from(clientsById.keys()).
      map(client => client)
      .filter(id => id !== clientId),
    type: "ASK"
  }));

}

/**
 * 
 * @param {any} payload 
 * @param {WebSocket} conn 
 */
function joinRoom(payload, conn) {

  const recipientId = payload.recipientId.trim();
  const clientId = payload.clientId.trim();

  const recipientConn = clientsById.get(recipientId);

  if (recipientConn) {
    rooms.set(clientId, recipientId);
    rooms.set(recipientId, clientId);

    conn.send(JSON.stringify({
      type: "JOINED",
      recipientId: recipientId,
    }));

    recipientConn.send(JSON.stringify({
      type: "JOINED",
      recipientId: clientId,
    }))
  } else {
    conn.send(JSON.stringify({
      data: Array.from(clientsById.keys()).
        map(client => client)
        .filter(id => id !== clientId),
      type: "ASK"
    }));
  }

}

/**
 * 
 * @param {any} payload 
 * @param {WebSocket} conn 
 */
function onChat(payload, conn) {

  const recipientId = payload.recipientId.trim();
  const clientId = payload.clientId.trim();;

  const recipientConn = clientsById.get(recipientId);

  if (recipientConn) {
    const message = payload.message;

    recipientConn.send(JSON.stringify({
      type: "Message",
      message: message.trim(),
      recipientId: clientId,
    }))

  } else {

    conn.send(JSON.stringify({
      type: "Message",
      message: "Message not sent. Recipient is offline",
      recipientId: "server",
    }))
  }
}