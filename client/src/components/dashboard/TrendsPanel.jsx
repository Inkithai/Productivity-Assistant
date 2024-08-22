import { useEffect, useState } from 'react';

import { fetchTrends } from '../../api/analytics.js';
import { MonthlyTrend } from './MonthlyTrend.jsx';
import { TagWorkload } from './TagWorkload.jsx';

export default function TrendsPanel() {
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchTrends()
      .then((data) => !cancelled && setTrends(data.trends))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!trends) return <p className="muted">Loading trends…</p>;

  const hasData =
    trends.monthly.some((month) => month.completed > 0) || trends.byTag.length > 0;

  if (!hasData) {
    return <p className="muted">Complete a few tasks and the trends will show up here.</p>;
  }

  return (
    <div className="trends-grid">
      <div className="card dashboard-panel">
        <h2>Completions per month</h2>
        <MonthlyTrend monthly={trends.monthly} />
      </div>
      <div className="card dashboard-panel">
        <h2>Open work by tag</h2>
        <TagWorkload byTag={trends.byTag} />
      </div>
    </div>
  );
}
