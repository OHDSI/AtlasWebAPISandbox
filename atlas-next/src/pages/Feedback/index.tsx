import { useState } from 'react';

export default function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setSubmitted(true);
      setMessage('');
    }
  };

  return (
    <div data-testid="page-feedback">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
      <p className="text-sm text-gray-600 mb-6">
        Share your feedback to help us improve Atlas.
      </p>

      {submitted ? (
        <div
          role="status"
          className="rounded border border-green-300 bg-green-50 p-4 text-green-800"
          data-testid="feedback-success"
        >
          Thank you for your feedback!
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg" data-testid="feedback-form">
          <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
            Your feedback
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Tell us what you think..."
            data-testid="feedback-textarea"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid="feedback-submit"
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}
