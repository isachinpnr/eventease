import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToPushNotifications,
  getNotificationStatus,
  isNotificationSupported,
  showBrowserNotification
} from '../services/pushNotification';

const NotificationPrompt = () => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (user) {
      setSupported(isNotificationSupported());
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getNotificationStatus();
      setSubscribed(status.subscribed || false);
      
      // Show prompt if not subscribed and supported
      if (!status.subscribed && isNotificationSupported()) {
        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    } catch (error) {
      console.error('Failed to check notification status:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await subscribeToPushNotifications();
      if (result.success) {
        setSubscribed(true);
        setShowPrompt(false);
        
        // Show welcome notification
        if (result.subscribed) {
          showBrowserNotification('🔔 Notifications Enabled!', {
            body: 'You will now receive notifications for bookings and updates.',
            tag: 'notification-enabled'
          });
        }
      } else {
        alert(result.error || 'Failed to enable notifications');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!user || !supported || subscribed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-6 z-50 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-4xl">🔔</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600">
            Get instant notifications for booking confirmations and updates!
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt;

