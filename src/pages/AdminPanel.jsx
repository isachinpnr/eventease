import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Music',
    location: 'Online',
    venue: '',
    date: '',
    time: '',
    capacity: '',
    price: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/attendees`);
      setAttendees(res.data);
      setSelectedEvent(eventId);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent}`, formData);
      } else {
        await api.post('/events', formData);
      }
      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        category: 'Music',
        location: 'Online',
        venue: '',
        date: '',
        time: '',
        capacity: '',
        price: 0
      });
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving event');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event._id);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      venue: event.venue || '',
      date: event.date.split('T')[0],
      time: event.time,
      capacity: event.capacity,
      price: event.price
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting event');
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
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-2">
              <span className="text-gradient">Admin Panel</span>
            </h1>
            <p className="text-gray-600 text-lg">Manage events and view attendees</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEvent(null);
              setFormData({
                title: '',
                description: '',
                category: 'Music',
                location: 'Online',
                venue: '',
                date: '',
                time: '',
                capacity: '',
                price: 0
              });
            }}
            className="btn-primary flex items-center gap-2"
          >
            <span>➕</span> Create Event
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{editingEvent ? '✏️' : '➕'}</span>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="Music">Music</option>
                    <option value="Tech">Tech</option>
                    <option value="Business">Business</option>
                    <option value="Sports">Sports</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Location *
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>

                {formData.location === 'In-Person' && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                    min="1"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <span className="flex items-center gap-2">
                    <span>{editingEvent ? '💾' : '✨'}</span>
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition-all duration-200 font-semibold shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span>📋</span> All Events
            </h2>
            <p className="text-blue-100 mt-1 text-sm md:text-base">Manage and monitor all your events</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Capacity
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event._id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      {event.eventId}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium">
                      {event.title}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          event.status === 'Upcoming'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'Ongoing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      {event.bookedSeats} / {event.capacity}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm space-x-2">
                      <button
                        onClick={() => fetchAttendees(event._id)}
                        className="text-blue-600 hover:underline"
                      >
                        View Attendees
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-green-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEvent && attendees.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-2xl font-bold mb-4">Attendees</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendees.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.seats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(booking.bookingDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                setSelectedEvent(null);
                setAttendees([]);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

