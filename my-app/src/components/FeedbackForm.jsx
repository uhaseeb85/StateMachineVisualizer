import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

const FeedbackForm = ({ onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('https://formsubmit.co/uhaseeb85@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          feedback,
          _subject: 'State Machine Visualizer Feedback'
        })
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
        onClose();
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      alert('Failed to send feedback. Please try again later.');
      console.error('Feedback error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 
                   dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>

        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Send Feedback
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Your Email (optional)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
              placeholder="Share your thoughts..."
              className="w-full h-32 px-3 py-2 text-sm border rounded-md 
                       dark:bg-gray-700 dark:text-white dark:border-gray-600
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            disabled={sending || !feedback}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white
                     dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {sending ? 'Sending...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm; 