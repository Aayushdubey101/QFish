import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EntitySchema {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

interface RelationSchema {
  source: string;
  target: string;
  type: string;
  attributes: Record<string, any>;
}

interface SimulationSchema {
  domain: string;
  entities: EntitySchema[];
  relations: RelationSchema[];
  global_metrics: Record<string, number>;
}

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || "ws://localhost:8080/ws";

function App() {
  const [schema, setSchema] = useState<SimulationSchema | null>(null);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  useEffect(() => {
    let ws = new WebSocket(ENGINE_URL);
    
    ws.onmessage = (event) => {
      const data: SimulationSchema = JSON.parse(event.data);
      setSchema(data);
      
      setMetricHistory(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), ...data.global_metrics }];
        return newData.slice(-50); // keep last 50
      });
    };
    
    ws.onclose = () => {
      console.log('WS closed. Reconnecting...');
      setTimeout(() => {
        ws = new WebSocket(ENGINE_URL);
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, []);

  if (!schema) {
    return <div className="p-8 text-center text-xl text-gray-500 font-bold">Waiting for QFish Simulation initialization...</div>;
  }

  const lines = Object.keys(schema.global_metrics).map((key, i) => {
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#387908"];
    return <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} />;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">QFish Sandbox</h1>
          <p className="text-gray-600 font-medium">Domain: {schema.domain}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Real-time Global Metrics</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                {lines}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 overflow-y-auto max-h-[480px]">
          <h2 className="text-xl font-bold mb-4">Entities ({schema.entities.length})</h2>
          <ul className="space-y-4">
            {schema.entities.map(ent => (
              <li key={ent.id} className="p-3 bg-gray-50 rounded border text-sm">
                <div className="font-semibold text-blue-600">{ent.id}</div>
                <div className="text-gray-500 text-xs uppercase">{ent.type}</div>
                <div className="mt-2 text-gray-700">
                  {Object.entries(ent.attributes).map(([k, v]) => (
                    <div key={k}>{k}: {JSON.stringify(v)}</div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-100 overflow-y-auto max-h-[300px]">
          <h2 className="text-xl font-bold mb-4">Relations</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schema.relations.map((rel, idx) => (
              <li key={idx} className="p-3 bg-gray-50 rounded border text-sm">
                <div className="text-gray-500 text-xs"><span className="font-semibold text-gray-800">{rel.source}</span> → <span className="font-semibold text-gray-800">{rel.target}</span></div>
                <div className="text-blue-500 mt-1 font-medium">{rel.type}</div>
              </li>
            ))}
          </ul>
      </div>
    </div>
  );
}

export default App;
