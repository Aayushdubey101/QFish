import React, { useState } from 'react';
import type { AppPage, SimulationSchema, MetricDataPoint } from './types';
import { HomePage } from './HomePage';
import { ConfigurePage } from './ConfigurePage';
import { SimulatePage } from './SimulatePage';
import { InsightsPage } from './InsightsPage';

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [documentText, setDocumentText] = useState('');
  const [schema, setSchema] = useState<SimulationSchema | null>(null);
  const [insight, setInsight] = useState('');
  const [metricHistory, setMetricHistory] = useState<MetricDataPoint[]>([]);

  const navigate = (target: AppPage, doc?: string) => {
    if (doc !== undefined) setDocumentText(doc);
    setPage(target);
  };

  const handleSchemaReady = (s: SimulationSchema) => {
    setSchema(s);
  };

  const handleInsightReady = (i: string) => {
    setInsight(i);
  };

  if (page === 'home') {
    return <HomePage onNavigate={navigate} />;
  }

  if (page === 'configure') {
    return (
      <ConfigurePage
        documentText={documentText}
        onNavigate={navigate}
        onSchemaReady={handleSchemaReady}
      />
    );
  }

  if (page === 'simulate' && schema) {
    return (
      <SimulatePage
        schema={schema}
        onNavigate={navigate}
        onInsightReady={handleInsightReady}
      />
    );
  }

  if (page === 'insights' && schema) {
    return (
      <InsightsPage
        schema={schema}
        insight={insight}
        metricHistory={metricHistory}
        onNavigate={navigate}
      />
    );
  }

  // Fallback — no schema yet, go home
  return <HomePage onNavigate={navigate} />;
}
