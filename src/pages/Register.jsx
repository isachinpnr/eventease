import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToPushNotifications, showBrowserNotification } from '../services/pushNotification';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      // Show success message with notification info
      setSuccess('Registration successful! Welcome email has been sent to your inbox.');
      
      // Try to enable notifications and send welcome notification
      setTimeout(async () => {
        try {
          const notificationResult = await subscribeToPushNotifications();
          if (notificationResult.success) {
            // Send welcome notification
            showBrowserNotification('🎉 Welcome to EventEase!', {
              body: 'Thanks for joining! Start exploring amazing events now.',
              tag: 'welcome',
              data: { url: '/events' }
            });
          }
        } catch (err) {
          // Silently fail - notifications are optional
          console.log('Notification subscription skipped:', err);
        }
      }, 500);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-5xl mb-4">🎉</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
            Join EventEase
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">Create your account and start booking events</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎉</span>
              <span className="font-bold text-lg">{success}</span>
            </div>
            <p className="text-sm text-green-700 ml-11">
              📧 Check your email for the welcome message!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <span>👤</span> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <span>📧</span> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <span>🔑</span> Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <span>🔒</span> Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Creating account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✨</span> Create Account
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
            Login here →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

