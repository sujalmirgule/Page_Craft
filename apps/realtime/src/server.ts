import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface RealtimeServerOptions {
  port: number;
  jwtSecret: string;
}

export function createRealtimeServer(options: RealtimeServerOptions) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'PAGECRAFT Realtime', uptime: process.uptime() }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // Protocol handshake foundation
    // Channel path: /ws/collaborate/:portfolioId
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`[PAGECRAFT Realtime] New socket connection on path: ${pathname}`);

    ws.on('message', (data: Buffer | string) => {
      // In subsequent phases, dispatch CRDT binary sync and presence awareness
    });

    ws.on('close', () => {
      // Disconnect handling
    });
  });

  return { server, wss };
}
