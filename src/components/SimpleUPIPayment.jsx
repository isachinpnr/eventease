import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const SimpleUPIPayment = ({ amount, bookingData, eventTitle, paymentLinkId, paymentUrl, uropayQrCode, onSuccess, onCancel }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [upiUrl, setUpiUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Get UPI ID from environment
  const upiId = import.meta.env.VITE_UPI_ID || 'shnraftaar@oksbi';
  
  // Generate a STABLE payment reference (only once, doesn't change)
  const paymentReferenceRef = useRef(null);
  if (!paymentReferenceRef.current) {
    // Generate reference once: EVT-{eventId}-{userId}-{timestamp}
    const eventId = bookingData?.eventId?.slice(-6) || 'EVENT';
    const userId = bookingData?.userId?.slice(-6) || 'USER';
    const timestamp = Date.now().toString().slice(-8);
    paymentReferenceRef.current = `EVT${eventId}${userId}${timestamp}`;
  }
  const paymentReference = paymentReferenceRef.current;

  // Function to generate direct UPI QR code (fallback)
  const generateDirectUPIQR = useRef(() => {
    // Format amount - UPI requires amount without decimals
    const formattedAmount = Math.round(parseFloat(amount) || 0).toString();
    
    // Create transaction note (simplified, no special characters)
    const transactionNote = `EventEase-${paymentReference}`;
    
    // Create UPI payment URL - proper format for all UPI apps
    const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    setUpiUrl(upiPaymentUrl);

    // Generate UPI QR code
    QRCode.toDataURL(upiPaymentUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    .then(url => {
      setQrCodeUrl(url);
    })
    .catch(err => {
      console.error('QR code generation error:', err);
      // Fallback: try with simplified format
      const simpleQrData = `${upiId}@${formattedAmount}`;
      QRCode.toDataURL(simpleQrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(fallbackUrl => {
        setQrCodeUrl(fallbackUrl);
      })
      .catch(fallbackErr => {
        console.error('Fallback QR code generation error:', fallbackErr);
      });
    });
  });

  // Generate QR code - Priority: UroPay QR > UroPay URL > Direct UPI
  useEffect(() => {
    // Priority 1: Use UroPay QR code if available (from payment gateway)
    if (uropayQrCode) {
      setQrCodeUrl(uropayQrCode);
      if (paymentUrl) {
        setUpiUrl(paymentUrl);
      }
      return;
    }

    // Priority 2: Generate QR from UroPay payment URL if available
    if (paymentUrl && paymentLinkId) {
      QRCode.toDataURL(paymentUrl, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
        setUpiUrl(paymentUrl);
      })
      .catch(err => {
        console.error('UroPay QR code generation error:', err);
        // Fallback to direct UPI
        generateDirectUPIQR.current();
      });
      return;
    }

    // Priority 3: Fallback to direct UPI QR code
    generateDirectUPIQR.current();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uropayQrCode, paymentUrl, paymentLinkId]); // Re-run if UroPay data changes

  // Automatic payment verification polling (Traditional payment app logic)
  useEffect(() => {
    if (paymentStatus === 'success' || !bookingData) return;

    // Start polling immediately when component mounts (user sees payment page)
    setCheckingPayment(true);
    
    let pollCount = 0;
    const maxPolls = 450; // 15 minutes (450 * 2 seconds)
    
    // Poll every 2 seconds to check payment status with payment gateway
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Check payment status with backend (which verifies with payment gateway)
        const response = await fetch(`${apiUrl}/payments/check-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            bookingData: bookingData,
            paymentReference: paymentReference,
            paymentLinkId: paymentLinkId || null, // Include payment link ID for gateway verification
            amount: amount
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.verified && result.booking) {
            clearInterval(pollInterval);
            setPaymentStatus('success');
            setCheckingPayment(false);
            onSuccess(result.booking);
            return;
          }
        }
        
        // Log polling status every 30 seconds for debugging
        if (pollCount % 15 === 0) {
          console.log(`Payment polling: Check ${pollCount}, PaymentLinkId: ${paymentLinkId || 'None'}, Status: ${paymentStatus}`);
          // If no paymentLinkId after 30 seconds, show manual verification option
          if (!paymentLinkId && pollCount === 30) {
            console.warn('⚠️ Direct UPI payment detected - Auto-verification not available. Use "Payment Completed" button after paying.');
          }
        }
      } catch (err) {
        console.error('Payment check error:', err);
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setCheckingPayment(false);
        console.log('Payment polling stopped after 15 minutes');
      }
    }, 2000); // Check every 2 seconds (traditional payment apps check frequently)

    return () => {
      clearInterval(pollInterval);
    };
  }, [paymentStatus, bookingData, paymentReference, paymentLinkId, amount, onSuccess]);

  const handleManualConfirm = async () => {
    if (!bookingData || !bookingData.bookingId) {
      alert('Booking data not found. Please refresh and try again.');
      return;
    }

    setCheckingPayment(true);
    setPaymentStatus('checking');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Call confirm payment endpoint (for direct UPI payments)
      const response = await fetch(`${apiUrl}/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: amount
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'Confirmed') {
          setPaymentStatus('success');
          setCheckingPayment(false);
          onSuccess(result);
        } else {
          setPaymentStatus('pending');
          setCheckingPayment(false);
          alert(result.message || 'Payment confirmation failed. Please contact support.');
        }
      } else {
        const error = await response.json();
        setPaymentStatus('pending');
        setCheckingPayment(false);
        alert(error.message || 'Failed to confirm payment. Please try again.');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setPaymentStatus('pending');
      setCheckingPayment(false);
      alert('Failed to confirm payment. Please check your connection and try again.');
    }
  };

  const handleOpenUPI = () => {
    // Try multiple methods to open UPI app
    if (upiUrl) {
      // Method 1: Direct window.location (works on mobile)
      try {
        window.location.href = upiUrl;
      } catch (e) {
        console.error('Failed to open UPI via location:', e);
      }
      
      // Method 2: Try opening in new window (fallback)
      setTimeout(() => {
        try {
          const link = document.createElement('a');
          link.href = upiUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error('Failed to open UPI via link:', e);
        }
      }, 100);
      
      // Show instructions if UPI app doesn't open
      setTimeout(() => {
        // Only show alert if on desktop (mobile should open app)
        if (window.innerWidth > 768) {
          alert('If UPI app didn\'t open automatically, please:\n1. Scan the QR code below\n2. Or manually open your UPI app and enter:\n   UPI ID: ' + upiId + '\n   Amount: ₹' + amount);
        }
      }, 2000);
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Pay via UPI - Quick & Easy
        </h3>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-center mb-6">
            {qrCodeUrl ? (
              <div className="inline-block p-4 bg-white rounded-lg border-4 border-blue-200 shadow-md">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="inline-block p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                  <p>Generating QR code...</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600 text-center mb-2">
                ₹{amount}
              </p>
              <p className="text-sm text-gray-600 text-center">
                {eventTitle}
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                UPI ID: {upiId}
              </p>
            </div>

            <button
              onClick={handleOpenUPI}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Open UPI App & Pay
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📱 How to Pay:</p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click "Open UPI App & Pay" button above (opens your UPI app directly)</li>
                <li>Or scan the QR code with PhonePe, Google Pay, Paytm, BHIM, or any UPI app</li>
                <li>Verify the amount and UPI ID shown above</li>
                <li>Confirm the payment in your UPI app</li>
                <li>Payment will be verified automatically within 2-4 seconds!</li>
              </ol>
              {paymentLinkId && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800 font-semibold">
                    ✅ Using UroPay Gateway - Automatic verification enabled
                  </p>
                </div>
              )}
              {!paymentLinkId && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800 font-semibold mb-1">
                    ⚠️ Direct UPI Payment Mode
                  </p>
                  <p className="text-xs text-yellow-700">
                    After completing payment, click "Payment Completed - Confirm" button below to verify your booking.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentStatus === 'success' ? (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-2xl font-bold text-green-800">Payment Successful!</h3>
              <p className="text-green-700">Your booking has been confirmed.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 text-center">
              ✅ Payment received and verified<br/>
              ✅ Booking confirmed<br/>
              ✅ Confirmation email sent
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Payment Status:</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                checkingPayment ? 'bg-yellow-500 animate-pulse' : 
                'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {checkingPayment ? 'Checking payment...' : 
                 'Waiting for payment'}
              </span>
            </div>
          </div>
        {checkingPayment && (
          <div className="mt-3">
            {paymentLinkId ? (
              <>
                <p className="text-xs text-gray-600 mb-2">
                  🔄 Automatically checking payment status every 2 seconds via UroPay gateway...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Please complete the payment in your UPI app. We'll detect it automatically!
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-600 mb-2">
                  ⚠️ Direct UPI Payment - Auto-verification not available
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  After you complete payment, click "Payment Completed - Confirm" button to verify your booking.
                </p>
              </>
            )}
          </div>
        )}
          {!checkingPayment && (
            <p className="text-xs text-gray-500 mt-2">
              Payment verification will start automatically when you scan the QR code.
            </p>
          )}
        </div>
      )}

      {paymentStatus !== 'success' && (
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {!paymentLinkId && (
            <button
              onClick={handleManualConfirm}
              disabled={checkingPayment}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {checkingPayment ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirming...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Completed - Confirm
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {paymentStatus === 'success' && (
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {upiId === 'your-upi-id@paytm' && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Setup Required:</p>
          <p className="text-xs text-yellow-700">
            Please add your UPI ID in <code className="bg-yellow-100 px-1 rounded">.env</code> file as <code className="bg-yellow-100 px-1 rounded">VITE_UPI_ID=your-upi-id@paytm</code>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Examples: <code className="bg-yellow-100 px-1 rounded">yourname@paytm</code>, <code className="bg-yellow-100 px-1 rounded">yourname@ybl</code>, <code className="bg-yellow-100 px-1 rounded">yourname@okaxis</code>
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 font-semibold mb-1">💡 Automatic Verification:</p>
        <p className="text-xs text-blue-700">
          After you complete payment, our system will automatically detect and confirm your booking. No manual steps needed!
        </p>
        <p className="text-xs text-blue-700 mt-1">
          All payments go directly to: <strong>{upiId}</strong>
        </p>
      </div>
    </div>
  );
};

export default SimpleUPIPayment;
