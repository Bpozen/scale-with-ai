import { useState, useEffect } from 'react';
import type { Tool } from '../lib/schema';

interface SearchBarProps {
  tools: Tool[];
}

export default function SearchBar({ tools }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Tool[]>(tools);
  const [filters, setFilters] = useState({
    pricing: '',
    dsgvo: '',
  });

  useEffect(() => {
    let result = tools;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description_de.toLowerCase().includes(q)
      );
    }

    if (filters.pricing) {
      result = result.filter(t => t.pricing_model === filters.pricing);
    }

    if (filters.dsgvo) {
      result = result.filter(t => t.dsgvo_status === filters.dsgvo);
    }

    setFiltered(result);
  }, [query, filters, tools]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="KI-Tool suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={filters.pricing}
          onChange={(e) => setFilters(f => ({ ...f, pricing: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Alle Preismodelle</option>
          <option value="free">Kostenlos</option>
          <option value="freemium">Freemium</option>
          <option value="paid">Bezahlt</option>
        </select>
        <select
          value={filters.dsgvo}
          onChange={(e) => setFilters(f => ({ ...f, dsgvo: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Alle DSGVO-Status</option>
          <option value="voll-konform">DSGVO-konform</option>
          <option value="teilweise">Teilweise</option>
          <option value="unklar">Unklar</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">{filtered.length} Tools gefunden</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(tool => (
          <article key={tool.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-lg">
              <a href={`/tools/${tool.slug}`} className="hover:text-blue-600">{tool.name}</a>
            </h3>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{tool.description_de}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
