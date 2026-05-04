import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  content_de: string;
  author_name: string;
  is_agent_generated: boolean;
  created_at: string;
}

interface ReviewSectionProps {
  toolId: string;
  initialReviews: Review[];
}

export default function ReviewSection({ toolId, initialReviews }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId, rating, content_de: content, author_name: author }),
      });
      if (!res.ok) {
        console.error('Failed to submit review:', res.status);
        return;
      }
      const newReview = await res.json();
      setReviews(prev => [newReview, ...prev]);
      setContent('');
      setAuthor('');
    } catch (err) {
      console.error('Review submission error:', err);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Bewertungen ({reviews.length})</h2>
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl font-bold text-yellow-500">{averageRating}</span>
          <span className="text-gray-500">/ 5</span>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {reviews.map(review => (
          <div key={review.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{review.author_name || 'Anonym'}</span>
              {review.is_agent_generated && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">KI-generiert</span>}
              <span className="text-yellow-500 ml-auto">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
            </div>
            <p className="text-gray-700 text-sm">{review.content_de}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Bewertung schreiben</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Bewertung (1-5)</label>
            <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full" />
            <span className="text-sm text-gray-500">{rating} Sterne</span>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Meinung</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full px-3 py-2 border rounded-lg h-24" required />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Absenden</button>
        </div>
      </form>
    </div>
  );
}
