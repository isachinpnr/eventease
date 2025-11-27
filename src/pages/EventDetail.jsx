import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { createUroPayPayment } from '../services/api';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';
import { hasEventStarted } from '../utils/eventDateTime';
import SimpleUPIPayment from '../components/SimpleUPIPayment';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');

    // If event has a price, use payment flow
    if (event.price > 0) {
      try {
        // Get payment details (no booking created yet)
        const response = await createUroPayPayment(id, seats);
        
        // Use UroPay payment if available, otherwise fallback to direct UPI
        setPaymentData({
          amount: response.amount || event.price * seats,
          bookingData: response.bookingData, // Store booking data to create after payment
          eventTitle: response.eventTitle || event.title,
          paymentLinkId: response.paymentLinkId || null, // Pass payment link ID for gateway verification
          paymentUrl: response.paymentUrl || null, // UroPay payment URL
          uropayQrCode: response.qrCode || null // UroPay QR code if available
        });
        setShowPayment(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment');
      }
      return;
    }

    // Free event - direct booking
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

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      // Payment response should already contain the confirmed booking
      const booking = paymentResponse;
      
      // Download PDF if available
      if (booking && booking.pdfConfirmation) {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(booking.pdfConfirmation), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `booking-confirmation-${booking._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }
      
      setSuccess('Payment successful! Booking confirmed. Confirmation email sent and PDF downloaded.');
      setShowPayment(false);
      setPaymentData(null);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎫 Payment Successful!', {
          body: `Your booking for "${event.title}" is confirmed. ${seats} seat(s) booked.`,
          icon: '/icon-192x192.png',
          tag: `booking-${booking?._id || 'pending'}`,
          data: { url: '/dashboard' }
        });
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      fetchEvent(); // Refresh event data
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed');
      setShowPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPaymentData(null);
    setError('');
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
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
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Event Details
              </h3>
              <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-semibold">Category:</span>
                  <span className="bg-white px-3 py-1 rounded-full text-sm">{event.category}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold">Location:</span>
                  <span>{event.location === 'Online' ? 'Online' : 'In-Person'}</span>
                </p>
                {event.venue && (
                  <p className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold">Venue:</span>
                    <span>{event.venue}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Date:</span>
                  <span>{formatDate(event.date)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Time:</span>
                  <span className="font-bold text-blue-600">{event.time}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Price:</span>
                  <span className="font-bold text-green-600 text-lg">₹{event.price}</span>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-100">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Availability
              </h3>
              <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold">Total Capacity:</span>
                  <span className="font-bold">{event.capacity}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Booked Seats:</span>
                  <span className="font-bold text-blue-600">{event.bookedSeats}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="font-semibold">Available Seats:</span>
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

          {user && canBook && !showPayment && (
            <div className="border-t-2 border-gray-200 pt-6 md:pt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Book Tickets
              </h3>
              
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-lg">{success}</span>
                  </div>
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Confirmation email sent to your inbox
                    <span className="mx-2">•</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF confirmation downloaded
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Number of Seats (Max 2)
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {event.price > 0 ? `Pay ₹${event.price * seats}` : 'Book Now'}
                    </span>
                  </button>
                </div>
              </div>
              {seats > availableSeats && (
                <p className="text-red-600 mt-3 font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Not enough seats available
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

          {user && canBook && showPayment && paymentData && (
            <div className="border-t-2 border-gray-200 pt-6 md:pt-8 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Complete Payment
              </h3>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-700 font-semibold mb-2">
                  Booking Summary:
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Event: <span className="font-semibold">{event.title}</span></p>
                  <p>Seats: <span className="font-semibold">{seats}</span></p>
                  <p className="text-lg font-bold text-green-600">Total: ₹{event.price * seats}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💳 Pay via UPI, Cards, Wallets, or Net Banking
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-lg">{success}</span>
                  </div>
                </div>
              )}

              <SimpleUPIPayment
                amount={paymentData.amount}
                bookingData={paymentData.bookingData}
                eventTitle={paymentData.eventTitle || event.title}
                paymentLinkId={paymentData.paymentLinkId}
                paymentUrl={paymentData.paymentUrl}
                uropayQrCode={paymentData.uropayQrCode}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
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

