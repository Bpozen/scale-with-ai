import { useState } from 'react';
import type { Tool } from '../lib/schema';

interface CompareWidgetProps {
  tools: Tool[];
}

export default function CompareWidget({ tools }: CompareWidgetProps) {
  const [toolA, setToolA] = useState('');
  const [toolB, setToolB] = useState('');
  const [result, setResult] = useState<{ toolA: Tool; toolB: Tool } | null>(null);

  const handleCompare = () => {
    const a = tools.find(t => t.slug === toolA);
    const b = tools.find(t => t.slug === toolB);
    if (a && b) setResult({ toolA: a, toolB: b });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        <select
          value={toolA}
          onChange={(e) => setToolA(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tool A wählen</option>
          {tools.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
        </select>
        <span className="self-center text-gray-400 font-bold">VS</span>
        <select
          value={toolB}
          onChange={(e) => setToolB(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tool B wählen</option>
          {tools.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
        </select>
        <button
          onClick={handleCompare}
          disabled={!toolA || !toolB}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vergleichen
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[result.toolA, result.toolB].map((tool, i) => (
            <div key={tool.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4">{tool.name}</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Preismodell</dt>
                  <dd className="font-medium">{tool.pricing_model || 'Unbekannt'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Preis ab</dt>
                  <dd className="font-medium">{tool.price_from !== null ? `${tool.price_from}€` : 'Auf Anfrage'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">DSGVO-Status</dt>
                  <dd className="font-medium">{tool.dsgvo_status || 'Unklar'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Server-Standort</dt>
                  <dd className="font-medium">{tool.server_location || 'Unbekannt'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Beschreibung</dt>
                  <dd className="text-sm text-gray-600">{tool.description_de}</dd>
                </div>
              </dl>
              <a href={`/tools/${tool.slug}`} className="mt-4 inline-block text-blue-600 hover:underline">Details ansehen →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
