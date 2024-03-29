import useSocket from '../../hooks/useSocket.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ReminderToaster() {
  const { push } = useToast();

  useSocket('reminder:due', (payload) => {
    push(payload.title, { type: 'reminder' });
  });

  return null;
}
