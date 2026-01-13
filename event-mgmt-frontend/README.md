# Event Management Frontend

Angular 21 event booking platform with Angular Material UI components.

## 🚀 Quick Start

```bash
cd event-mgmt-frontend
npm install
npm start
```

Open `http://localhost:4200`

## 🔑 Demo Login

- **Regular User**: Any email/password
- **Admin User**: Email containing 'admin' (e.g., admin@test.com)
- Shows actual email and user ID in toolbar after login

## ✅ Features

### User Features
- **Login**: JWT authentication with demo mode
- **Preferences**: Select event categories (Cat 1, Cat 2, Cat 3)
- **Calendar**: View filtered time slots based on preferences
- **Booking**: Book and cancel slots with real-time updates

### Admin Features
- **Slot Management**: Add, update, delete time slots
- **Date Picker**: Schedule slots with Angular Material date picker
- **Overlap Prevention**: Validates against existing slots
- **Capacity Control**: Set and modify slot capacities

### UI Components
- **Material Design**: Cards, forms, buttons, snackbars
- **Responsive**: Mobile-first grid layout
- **Loading States**: Progress spinners and error handling
- **Navigation**: Toolbar with user menu and role-based access

## 🛠️ Architecture

- **Standalone Components**: Modern Angular 21 architecture
- **Reactive Forms**: Validation and error handling
- **RxJS**: Observable-based state management
- **Route Guards**: Authentication and admin protection
- **HTTP Interceptors**: Automatic JWT token handling
- **Demo Mode**: Works offline with mock data

## 📱 Demo Mode

When backend unavailable:
- Mock authentication accepts any credentials
- Generates sample time slots and categories
- Simulates booking operations locally
- Full admin panel functionality

## 🎯 API Integration

Designed to work with backend endpoints:
- `POST /login` - Authentication
- `GET /categories` - Event categories
- `POST /user/preferences` - User preferences
- `GET /slots` - Time slots (filtered by categories)
- `POST /bookings` - Create booking
- `DELETE /bookings/{id}` - Cancel booking
- `POST /admin/slots` - Admin slot creation
- `PUT /admin/slots/{id}` - Admin slot updates
- `DELETE /admin/slots/{id}` - Admin slot deletion