import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { hasEventStarted } from '../utils/eventDateTime';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      // Refresh bookings - cancelled booking will be automatically removed
      await fetchBookings();
      // Show success message
      alert('Booking cancelled successfully. It has been removed from your dashboard.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleDownloadPDF = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `booking-confirmation-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-2">
              <span className="text-gradient">My Bookings</span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">Manage all your event reservations</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              💡 Cancelled bookings and completed events (after 1 hour) are automatically removed
            </p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-md w-full sm:w-auto">
            <button
              onClick={() => setView('list')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                view === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>📋</span> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                view === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>📅</span> Calendar
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="text-7xl mb-6">📭</div>
            <p className="text-2xl text-gray-700 font-semibold mb-4">No bookings to display</p>
            <p className="text-gray-500 mb-6">Start exploring and book your first event!</p>
            <Link
              to="/events"
              className="inline-block btn-primary"
            >
              <span className="flex items-center gap-2">
                <span>🔍</span> Browse Events
              </span>
            </Link>
            <p className="text-sm text-gray-400 mt-6">
              Note: Cancelled bookings and completed events (after 1 hour) are automatically removed
            </p>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 card-hover border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {booking.event.title}
                      </h3>
                      <span
                        className={`status-badge ${
                          booking.status === 'Confirmed'
                            ? 'status-upcoming'
                            : 'status-completed'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-gray-700">
                          <span className="font-semibold">📅 Date:</span>
                          <span>{formatDate(booking.event.date)} {booking.event.time}</span>
                        </p>
                        <p className="flex items-center gap-2 text-gray-700">
                          <span className="font-semibold">📍 Location:</span>
                          <span>{booking.event.location === 'Online' ? '🌐 Online' : '🏢 ' + booking.event.location}</span>
                        </p>
                        {booking.event.venue && (
                          <p className="flex items-center gap-2 text-gray-700">
                            <span className="font-semibold">🏛️ Venue:</span>
                            <span>{booking.event.venue}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-gray-700">
                          <span className="font-semibold">💺 Seats:</span>
                          <span className="font-bold text-blue-600">{booking.seats}</span>
                        </p>
                        <p className="flex items-center gap-2 text-gray-700">
                          <span className="font-semibold">📆 Booking Date:</span>
                          <span>{formatDate(booking.bookingDate)}</span>
                        </p>
                        {booking.totalAmount > 0 && (
                          <p className="flex items-center gap-2 text-gray-700">
                            <span className="font-semibold">💰 Total:</span>
                            <span className="font-bold text-green-600">₹{booking.totalAmount}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => handleDownloadPDF(booking._id)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm w-full sm:w-auto"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>📄</span> Download PDF
                      </span>
                    </button>
                    {booking.status === 'Confirmed' && (() => {
                      // Check if event has started (date + time has passed)
                      // User can cancel only if event date/time is in the future
                      const eventStarted = hasEventStarted(booking.event.date, booking.event.time);
                      const canCancel = !eventStarted;
                      
                      return canCancel ? (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm w-full sm:w-auto"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <span>❌</span> Cancel
                          </span>
                        </button>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium text-center w-full sm:w-auto">
                          <span className="flex items-center gap-2 justify-center">
                            <span>🔒</span> Event Started
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Calendar View</h2>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                (day) => (
                  <div key={day} className="font-semibold text-center py-2">
                    {day}
                  </div>
                )
              )}
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="col-span-7 md:col-span-1 border rounded-lg p-2 bg-blue-50"
                >
                  <p className="text-sm font-semibold">
                    {formatDate(booking.event.date)}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {booking.event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

