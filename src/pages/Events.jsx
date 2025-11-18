import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    startDate: '',
    endDate: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ category: '', location: '', startDate: '', endDate: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            <span className="text-gradient">Browse Events</span>
          </h1>
          <p className="text-xl text-gray-600">Discover amazing events happening around you</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🔍</span>
            <h2 className="text-2xl font-bold text-gray-900">Filter Events</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-1">
                <span>🏷️</span> Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Categories</option>
                <option value="Music">🎵 Music</option>
                <option value="Tech">💻 Tech</option>
                <option value="Business">💼 Business</option>
                <option value="Sports">⚽ Sports</option>
                <option value="Education">📚 Education</option>
                <option value="Other">🎭 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-1">
                <span>📍</span> Location
              </label>
              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Locations</option>
                <option value="Online">🌐 Online</option>
                <option value="In-Person">🏢 In-Person</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-1">
                <span>📅</span> Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-1">
                <span>📅</span> End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="mt-6 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <span>🔄</span> Clear Filters
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
            <div className="text-2xl text-gray-600 font-semibold">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-2xl text-gray-600 font-semibold mb-2">No events found</div>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                      {event.title}
                    </h3>
                    <span
                      className={`status-badge ${
                        event.status === 'Upcoming'
                          ? 'status-upcoming'
                          : event.status === 'Ongoing'
                          ? 'status-ongoing'
                          : 'status-completed'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 font-mono">
                    {event.eventId}
                  </p>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                    {event.description}
                  </p>
                  <div className="space-y-2 mb-5 text-sm bg-gray-50 p-3 rounded-lg">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">🏷️ Category:</span>
                      <span className="text-gray-600">{event.category}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">📍 Location:</span>
                      <span className="text-gray-600">{event.location === 'Online' ? '🌐 Online' : '🏢 In-Person'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">📅 Date:</span>
                      <span className="text-gray-600">{formatDate(event.date)} {event.time}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">💺 Seats:</span>
                      <span className={`font-bold ${event.capacity - event.bookedSeats > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {event.capacity - event.bookedSeats} / {event.capacity} available
                      </span>
                    </p>
                    {event.price > 0 && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">💰 Price:</span>
                        <span className="text-blue-600 font-bold">₹{event.price}</span>
                      </p>
                    )}
                  </div>
                  {user ? (
                    <Link
                      to={`/events/${event._id}`}
                      className="block w-full btn-primary text-center py-3"
                    >
                      View Details →
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full bg-gray-400 text-white text-center py-3 rounded-lg hover:bg-gray-500 transition-all duration-200 font-semibold"
                    >
                      🔐 Login to Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

