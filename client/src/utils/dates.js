function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function dueLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const dayDiff = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000
  );

  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff === -1) return 'Yesterday';
  if (dayDiff < 0) return `Overdue · ${formatDate(date)}`;
  return formatDate(date);
}

export function isOverdue(value) {
  if (!value) return false;
  return startOfDay(new Date(value)).getTime() < startOfDay(new Date()).getTime();
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  const weeks = [];
  const cursor = new Date(start);
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
    const nextMonthReached = cursor.getMonth() !== month && cursor > new Date(year, month + 1, 0);
    if (nextMonthReached && week >= 4) break;
  }
  return weeks;
}

export function dayKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
