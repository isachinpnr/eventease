# EventEase - Event Booking Platform

A full-stack event booking platform where users can explore and book events such as concerts, webinars, or workshops. Admins can create and manage events, while users can book tickets and view their bookings.

## Features

### Public User
- ✅ View marketing landing page
- ✅ Browse available events
- ✅ Filter events by:
  - Category (Music, Tech, Business, Sports, Education, Other)
  - Location (Online/In-Person)
  - Date range
- ✅ Register or log in

### Logged-in User
- ✅ Book up to 2 seats per event
- ✅ View bookings in list view or calendar view
- ✅ Cancel bookings (only if event hasn't started)
- ✅ See booking status and confirmation details

### Admin
- ✅ Access admin panel via login
- ✅ Create, update, or delete events
- ✅ Set event capacity
- ✅ View full list of attendees for each event
- ✅ Monitor event statuses: Upcoming, Ongoing, Completed

## Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
Event_Plateform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── eventController.js
│   │   │   └── bookingController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── bookingLogger.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   └── Booking.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── eventRoutes.js
│   │   │   └── bookingRoutes.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── generateEventId.js
│   │   │   ├── formatDate.js
│   │   │   └── eventStatus.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Events.jsx
│   │   ├── EventDetail.jsx
│   │   ├── Dashboard.jsx
│   │   └── AdminPanel.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── formatDate.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── API_DOCUMENTATION.md
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventease
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

5. Make sure MongoDB is running on your system or update `MONGODB_URI` to your MongoDB Atlas connection string.

6. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the root directory (if not already there):
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port Vite assigns)

## Usage

### Creating an Admin User

To create an admin user, you can either:

1. **Register normally and update in database:**
   - Register a user through the frontend
   - Update the user's role to "admin" in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

2. **Use MongoDB Compass or mongo shell** to directly insert an admin user

### Testing the Application

1. **As a Public User:**
   - Visit the landing page
   - Browse events
   - Filter events by category, location, or date
   - Register for an account

2. **As a Regular User:**
   - Login with your credentials
   - Browse and view event details
   - Book up to 2 seats per event
   - View your bookings in the dashboard
   - Cancel bookings (if event hasn't started)

3. **As an Admin:**
   - Login with admin credentials
   - Access the Admin Panel
   - Create, update, or delete events
   - View attendees for each event
   - Monitor event statuses

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoint documentation.

## Key Features Implementation

### Booking Logic
- Users can book 1-2 seats per event
- Prevents booking if event is at full capacity
- Prevents duplicate bookings (one booking per user per event)
- Auto-generates custom event IDs: `EVT-[MMM][YYYY]-[Random3]` (e.g., `EVT-AUG2025-X4T`)

### Event Status
- Dynamically determined based on event date:
  - **Upcoming**: Event is in the future
  - **Ongoing**: Event is today
  - **Completed**: Event has passed

### Authentication
- JWT-based user login and registration
- Role-based access control (user/admin)
- Protected routes with middleware
- Token stored in localStorage

### Custom Middleware
- Booking logger middleware logs each new booking with:
  - Timestamp
  - User ID and email
  - Event ID
  - Number of seats
  - Booking ID

### Date Formatting
- Consistent `DD-MMM-YYYY` format across the application (e.g., `30-Jul-2025`)

## Development

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration (default: 7d)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)
## Payment Integration

This platform now supports secure payment processing using Stripe. Users can book paid events with credit/debit cards, and automatic refunds are processed on cancellation.

### Payment Features
- ✅ Secure payment processing with Stripe
- ✅ Support for free events (price = 0)
- ✅ Automatic refunds on cancellation
- ✅ Payment status tracking
- ✅ PDF confirmation generation
- ✅ Email notifications
- ✅ Webhook handling for reliable payment confirmation

### Setup Instructions

See [PAYMENT_SETUP.md](./PAYMENT_SETUP.md) for detailed payment integration setup instructions.

**Quick Setup:**
1. Get Stripe API keys from https://dashboard.stripe.com/test/apikeys
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `backend/.env`
3. Add `VITE_STRIPE_PUBLISHABLE_KEY` to root `.env`
4. For local testing, use Stripe CLI: `stripe listen --forward-to localhost:5000/api/payments/webhook`

## License

This project is created as an assignment for Koders.

## Contact

For questions or issues, please contact: uttarakhandtechnology@gmail.com
