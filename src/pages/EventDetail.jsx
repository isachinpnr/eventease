import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';
import { hasEventStarted } from '../utils/eventDateTime';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await api.post('/bookings', { eventId: id, seats });
      
      // Download PDF if available
      if (response.data.pdfConfirmation) {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(response.data.pdfConfirmation), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `booking-confirmation-${response.data._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }
      
      setSuccess('Booking successful! Confirmation email sent and PDF downloaded.');
      
      // Show browser notification if push notifications aren't available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎫 Booking Confirmed!', {
          body: `Your booking for "${event.title}" is confirmed. ${seats} seat(s) booked.`,
          icon: '/icon-192x192.png',
          tag: `booking-${response.data._id}`,
          data: { url: '/dashboard' }
        });
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      fetchEvent(); // Refresh event data
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Event not found</div>
      </div>
    );
  }

  const availableSeats = event.capacity - event.bookedSeats;
  const eventStarted = hasEventStarted(event.date, event.time);
  const canBook = availableSeats > 0 && !eventStarted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          to="/events"
          className="text-blue-600 hover:text-blue-800 font-semibold mb-6 inline-flex items-center gap-2 transition-colors"
        >
          <span>←</span> Back to Events
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
            <div className="flex-1 w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3">
                {event.title}
              </h1>
              <p className="text-gray-500 font-mono text-xs sm:text-sm">Event ID: {event.eventId}</p>
            </div>
            <span
              className={`status-badge ${
                event.status === 'Upcoming'
                  ? 'status-upcoming'
                  : event.status === 'Ongoing'
                  ? 'status-ongoing'
                  : 'status-completed'
              } text-base px-4 py-2`}
            >
              {event.status}
            </span>
          </div>

          <p className="text-gray-700 text-base sm:text-lg mb-6 md:mb-8 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
            {event.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Event Details
              </h3>
              <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🏷️ Category:</span>
                  <span className="bg-white px-3 py-1 rounded-full text-sm">{event.category}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📍 Location:</span>
                  <span>{event.location === 'Online' ? '🌐 Online' : '🏢 In-Person'}</span>
                </p>
                {event.venue && (
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">🏛️ Venue:</span>
                    <span>{event.venue}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📅 Date:</span>
                  <span>{formatDate(event.date)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">⏰ Time:</span>
                  <span className="font-bold text-blue-600">{event.time}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">💰 Price:</span>
                  <span className="font-bold text-green-600 text-lg">₹{event.price}</span>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-100">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-4 flex items-center gap-2">
                <span>💺</span> Availability
              </h3>
              <div className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📊 Total Capacity:</span>
                  <span className="font-bold">{event.capacity}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">✅ Booked Seats:</span>
                  <span className="font-bold text-blue-600">{event.bookedSeats}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🎫 Available Seats:</span>
                  <span
                    className={`font-bold text-xl ${
                      availableSeats > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {availableSeats}
                  </span>
                </p>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(availableSeats / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {user && canBook && (
            <div className="border-t-2 border-gray-200 pt-6 md:pt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span>🎫</span> Book Tickets
              </h3>
              
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">✅</span>
                    <span className="font-bold text-lg">{success}</span>
                  </div>
                  <p className="text-sm text-green-700 ml-11">
                    📧 Confirmation email sent to your inbox • 📄 PDF confirmation downloaded
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span>💺</span> Number of Seats (Max 2)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    value={seats}
                    onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                    className="w-full sm:w-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-base sm:text-lg text-center"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleBooking}
                    disabled={seats > availableSeats || seats < 1 || seats > 2}
                    className="btn-primary w-full sm:w-auto px-6 sm:px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>✨</span> Book Now
                    </span>
                  </button>
                </div>
              </div>
              {seats > availableSeats && (
                <p className="text-red-600 mt-3 font-semibold flex items-center gap-2">
                  <span>⚠️</span> Not enough seats available
                </p>
              )}
              {event.price > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
                  <p className="text-gray-700 font-semibold">
                    Total Amount: <span className="text-2xl font-bold text-green-600">₹{event.price * seats}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="border-t pt-6">
              <p className="text-gray-600 mb-4">
                Please{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  login
                </Link>{' '}
                to book tickets
              </p>
            </div>
          )}

          {!canBook && (
            <div className="border-t pt-6">
              <p className="text-red-600 font-semibold">
                {eventStarted
                  ? 'This event has already started. Booking is no longer available.'
                  : availableSeats === 0
                  ? 'This event is fully booked'
                  : 'This event has already ended'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

