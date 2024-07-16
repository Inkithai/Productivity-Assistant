import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { searchEverything } from '../../api/search.js';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';

const TYPE_ROUTES = {
  task: '/tasks',
  note: '/notes',
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const boxRef = useRef(null);

  const debounced = useDebouncedValue(query.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    searchEverything(debounced)
      .then((data) => {
        if (cancelled) return;
        setResults(data.results);
        setSearched(true);
        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) setSearched(true);
      })
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    function onClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="global-search" ref={boxRef}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search tasks and notes…"
        aria-label="Search tasks and notes"
      />
      {open && (
        <div className="search-results card">
          {busy && <p className="muted">Searching…</p>}
          {!busy && searched && results.length === 0 && (
            <p className="muted">Nothing matched “{debounced}”.</p>
          )}
          {!busy &&
            results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                to={TYPE_ROUTES[result.type] || '/'}
                className="search-result-row"
                onClick={handleSelect}
              >
                <span className={`search-type type-${result.type}`}>{result.type}</span>
                <span className="search-title">{result.title}</span>
                <span className="muted">{Math.round(result.score * 100)}%</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
