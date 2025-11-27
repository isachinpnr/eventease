// Frontend Push Notification Service
import api from './api';

// Check if browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { granted: false, error: 'Notifications not supported in this browser' };
  }

  if (Notification.permission === 'granted') {
    return { granted: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, permission: 'denied', error: 'Notification permission denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { 
      granted: permission === 'granted', 
      permission 
    };
  } catch (error) {
    return { granted: false, error: error.message };
  }
};

// Get VAPID public key from server
export const getVAPIDPublicKey = async () => {
  try {
    const response = await api.get('/notifications/vapid-key');
    return response.data.publicKey;
  } catch (error) {
    console.error('Failed to get VAPID key:', error);
    return null;
  }
};

// Convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async () => {
  try {
    // Request permission
    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.granted) {
      return { 
        success: false, 
        error: permissionResult.error || 'Notification permission not granted' 
      };
    }

    // Register service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    } catch (error) {
      // If service worker registration fails, create a simple one
      console.warn('Service worker registration failed, using fallback:', error);
      // For now, we'll use a simplified approach without service worker
      // In production, you should have a proper service worker file
    }

    // Get VAPID public key
    const publicKey = await getVAPIDPublicKey();
    if (!publicKey || publicKey === 'DEMO_PUBLIC_KEY') {
      // Fallback: Use browser notifications without push subscription
      return {
        success: true,
        subscribed: false,
        message: 'Notifications enabled (browser notifications only)'
      };
    }

    // Subscribe to push manager
    let subscription;
    if (registration && registration.pushManager) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      } catch (error) {
        console.warn('Push subscription failed, using browser notifications:', error);
        subscription = null;
      }
    }

    // Extract keys from subscription
    let subscriptionData = null;
    if (subscription) {
      const p256dhKey = subscription.getKey ? subscription.getKey('p256dh') : null;
      const authKey = subscription.getKey ? subscription.getKey('auth') : null;
      
      if (p256dhKey && authKey) {
        // Convert ArrayBuffer to base64
        const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
        const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));
        
        subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh,
            auth
          }
        };
      }
    }

    // If we have subscription data, send to server
    if (subscriptionData) {
      try {
        const response = await api.post('/notifications/subscribe', {
          subscription: subscriptionData
        });
        return { 
          success: true, 
          subscribed: true,
          ...response.data 
        };
      } catch (error) {
        console.error('Failed to save subscription:', error);
      }
    }

    // Fallback: Browser notifications only (no push subscription)
    return {
      success: true,
      subscribed: false,
      message: 'Browser notifications enabled (push subscription not available)'
    };
  } catch (error) {
    console.error('Push subscription error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async () => {
  try {
    const response = await api.post('/notifications/unsubscribe');
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Get notification subscription status
export const getNotificationStatus = async () => {
  try {
    const response = await api.get('/notifications/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get notification status:', error);
    return { subscribed: false };
  }
};

// Show browser notification (fallback)
export const showBrowserNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notification = new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    ...options
  });

  notification.onclick = () => {
    window.focus();
    if (options.data?.url) {
      window.location.href = options.data.url;
    }
    notification.close();
  };

  return true;
};

