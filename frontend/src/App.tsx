import React, { useState, useCallback } from 'react';
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

  const navigate = useCallback((target: AppPage, doc?: string) => {
    if (doc !== undefined) setDocumentText(doc);
    setPage(target);
  }, []);

  const handleSchemaReady = useCallback((s: SimulationSchema) => {
    setSchema(s);
    setMetricHistory([]); // reset history for new simulation
    setInsight('');
  }, []);

  const handleInsightReady = useCallback((i: string) => {
    setInsight(i);
  }, []);

  // Called by SimulatePage so App holds the authoritative history for InsightsPage
  const handleHistoryUpdate = useCallback((h: MetricDataPoint[]) => {
    setMetricHistory(h);
  }, []);

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
        onHistoryUpdate={handleHistoryUpdate}
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

  return <HomePage onNavigate={navigate} />;
}
