import { App } from 'https://cdn.jsdelivr.net/npm/@wazo/euc-plugins-sdk@0.0.23/lib/esm/app.js';

let socket = null;
let started = false;
let host;
let token;

const app = new App();

const events = document.getElementById('events');

const connect = () => {
  if (socket != null) {
    console.log('socket already connected');
    return;
  }

  socket = new WebSocket('wss://' + host + '/api/websocketd/?version=2&token=' + token);
  socket.onclose = function (event) {
    socket = null;
    console.log(
      'websocketd closed with code ' + event.code + " and reason '" + event.reason + "'"
    );
  };
  socket.onmessage = function (event) {
    const msg = JSON.parse(event.data);
    switch (msg.op) {
      case 'init':
        subscribe('*');
        start();
        break;
      case 'start':
        console.log('waiting for messages');
        break;
      case 'event':
        add(msg.data);
        break;
      }
    };
    started = false;
}

function subscribe(event_name) {
  const msg = {
    op: 'subscribe',
      data: {
        event_name: event_name,
      },
    };
    socket.send(JSON.stringify(msg));
  }

function start() {
  const msg = {
    op: 'start',
  };
  socket.send(JSON.stringify(msg));
}

function add(data) {
  console.log(`Message received: ${data.name}`);
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML += `
      <tr class="mui--text-center">
        <td>${data.name}</td>
        <td>${JSON.stringify(data.data)}</td>
      </tr>
    `;
}

(async () => {
  await app.initialize();
  const context = app.getContext();
  console.log(context);

  host = context.app.extra.stack.host;
  token = context.app.extra.stack.session.token;

  events.innerHTML += `
    <table class="mui-table mui-table--bordered">
      <thead>
        <tr>
          <th>Name</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody id="eventsList"></tbody>
    </table>
  `;

  connect();
})();
