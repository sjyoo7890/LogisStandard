import { useEffect, useRef, useCallback } from 'react';
import { useSystemStore } from '../stores/useSystemStore';

type MessageHandler = (event: string, data: unknown) => void;

export function useWebSocket(url: string, onMessage?: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { setWsConnected } = useSystemStore();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          onMessage?.(parsed.event, parsed.data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket construction failed (e.g., no server) — enter simulation mode
      setWsConnected(false);
    }
  }, [url, onMessage, setWsConnected]);

  useEffect(() => {
    // In demo mode, simulate connected state without actual WS
    const simulationMode = true; // No backend available
    if (simulationMode) {
      setWsConnected(true); // Simulate as connected
      return;
    }
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect, setWsConnected]);

  const send = useCallback((event: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  return { send };
}
