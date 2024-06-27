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
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML += `
      <tr class="mui--text-left">
        <td><b>${data.name}</b></td>
        <td><pre class="json-container">${prettyPrintJson.toHtml(data.data)}</pre></td>
      </tr>
    `;
}

(async () => {
  await app.initialize();
  const context = app.getContext();

  host = context.app.extra.stack.host;
  token = context.app.extra.stack.session.token;

  events.innerHTML += `
    <table class="mui-table mui-table--bordered">
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody id="eventsList"></tbody>
    </table>
  `;

  connect();
})();
