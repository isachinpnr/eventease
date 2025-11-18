import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8 animate-bounce">
            <span className="text-7xl">🎉</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to EventEase
          </h1>
          <p className="text-2xl text-gray-700 mb-4 font-medium">
            Your one-stop platform for discovering and booking amazing events
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            From concerts to webinars, find and reserve your spot with ease. 
            Experience seamless event management like never before.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/events"
              className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
            >
              <span>🔍</span> Browse Events
            </Link>
            <Link
              to="/register"
              className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
            >
              <span>🚀</span> Get Started
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover border border-gray-100">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Discover Events
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Browse through a wide variety of events including concerts,
              tech conferences, business workshops, and more. Find exactly what you're looking for.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover border border-gray-100">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Easy Booking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Book up to 2 seats per event with just a few clicks.
              Manage all your bookings in one place with our intuitive dashboard.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg card-hover border border-gray-100">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Organized
            </h3>
            <p className="text-gray-600 leading-relaxed">
              View your bookings in list or calendar view.
              Cancel bookings anytime before the event starts with full flexibility.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-lg">
            <p className="text-lg font-semibold">✨ Join thousands of happy event-goers today!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

