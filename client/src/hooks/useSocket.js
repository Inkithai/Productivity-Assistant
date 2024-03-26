import { useEffect, useRef } from 'react';

import { connectSocket } from '../api/socket.js';

export default function useSocket(event, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = connectSocket();
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
