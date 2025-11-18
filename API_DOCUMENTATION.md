# EventEase API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
- **POST** `/auth/register`
- **Access**: Public
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user" // optional, defaults to "user"
}
```
- **Response**:
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "jwt_token"
}
```

### Login User
- **POST** `/auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "jwt_token"
}
```

### Get Current User
- **GET** `/auth/me`
- **Access**: Private
- **Response**:
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

---

## Event Endpoints

### Get All Events
- **GET** `/events`
- **Access**: Public
- **Query Parameters**:
  - `category` (optional): Filter by category (Music, Tech, Business, Sports, Education, Other)
  - `location` (optional): Filter by location (Online, In-Person)
  - `startDate` (optional): Filter events from this date (YYYY-MM-DD)
  - `endDate` (optional): Filter events until this date (YYYY-MM-DD)
- **Example**: `/events?category=Tech&location=Online&startDate=2025-01-01`
- **Response**:
```json
[
  {
    "_id": "event_id",
    "eventId": "EVT-AUG2025-X4T",
    "title": "Tech Conference 2025",
    "description": "Annual tech conference",
    "category": "Tech",
    "location": "Online",
    "venue": "",
    "date": "2025-08-15T00:00:00.000Z",
    "time": "10:00",
    "capacity": 100,
    "bookedSeats": 45,
    "price": 500,
    "status": "Upcoming",
    "createdBy": {
      "_id": "admin_id",
      "name": "Admin",
      "email": "admin@example.com"
    }
  }
]
```

### Get Single Event
- **GET** `/events/:id`
- **Access**: Public
- **Response**: Same as single event object above

### Create Event
- **POST** `/events`
- **Access**: Private (Admin only)
- **Body**:
```json
{
  "title": "Tech Conference 2025",
  "description": "Annual tech conference",
  "category": "Tech",
  "location": "Online",
  "venue": "", // optional, required if location is "In-Person"
  "date": "2025-08-15",
  "time": "10:00",
  "capacity": 100,
  "price": 500
}
```
- **Response**: Created event object

### Update Event
- **PUT** `/events/:id`
- **Access**: Private (Admin only)
- **Body**: Same as create event (all fields optional)
- **Response**: Updated event object

### Delete Event
- **DELETE** `/events/:id`
- **Access**: Private (Admin only)
- **Response**:
```json
{
  "message": "Event removed"
}
```

### Get Event Attendees
- **GET** `/events/:id/attendees`
- **Access**: Private (Admin only)
- **Response**:
```json
[
  {
    "_id": "booking_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "event": {
      "_id": "event_id",
      "title": "Tech Conference 2025",
      "date": "2025-08-15T00:00:00.000Z"
    },
    "seats": 2,
    "status": "Confirmed",
    "bookingDate": "2025-07-01T00:00:00.000Z"
  }
]
```

---

## Booking Endpoints

### Create Booking
- **POST** `/bookings`
- **Access**: Private
- **Body**:
```json
{
  "eventId": "event_id",
  "seats": 2 // Must be between 1 and 2
}
```
- **Response**:
```json
{
  "_id": "booking_id",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "event": {
    "_id": "event_id",
    "title": "Tech Conference 2025",
    "date": "2025-08-15T00:00:00.000Z",
    "location": "Online",
    "venue": ""
  },
  "seats": 2,
  "status": "Confirmed",
  "bookingDate": "2025-07-01T00:00:00.000Z",
  "totalAmount": 1000
}
```

### Get User Bookings
- **GET** `/bookings`
- **Access**: Private
- **Response**: Array of booking objects (same structure as create booking response)

### Get Single Booking
- **GET** `/bookings/:id`
- **Access**: Private (User must own booking or be admin)
- **Response**: Single booking object

### Cancel Booking
- **PUT** `/bookings/:id/cancel`
- **Access**: Private (User must own booking)
- **Response**:
```json
{
  "message": "Booking cancelled successfully",
  "booking": { /* booking object */ }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "message": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors, business logic errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Event Status Logic

Event status is automatically determined based on the event date:
- **Upcoming**: Event date is in the future
- **Ongoing**: Event date is today
- **Completed**: Event date has passed

---

## Event ID Format

Event IDs are auto-generated in the format: `EVT-[MMM][YYYY]-[Random3]`
- Example: `EVT-AUG2025-X4T`
- Format: `EVT-` + Month abbreviation + Year + `-` + 3 random alphanumeric characters

---

## Date Format

All dates in responses are in ISO 8601 format. The frontend displays dates in `DD-MMM-YYYY` format (e.g., `30-Jul-2025`).

