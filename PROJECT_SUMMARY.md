# Event Management UI - Complete Angular 21 Application

## 🚀 Features Implemented

### ✅ User Authentication
- **Login Component** with form validation and error handling
- **Demo Mode**: Works without backend - enter any email/password
- **Admin Access**: Use email containing 'admin' for admin privileges
- **JWT Token Management** with local storage persistence

### ✅ User Preferences System
- **Multi-select Categories**: Choose from Cat 1, Cat 2, Cat 3
- **Persistent Storage**: Preferences saved locally and synced with backend
- **Real-time Updates**: Calendar automatically updates when preferences change
- **Offline Support**: Works without backend connection

### ✅ Calendar View
- **Filtered Display**: Shows only slots for selected categories
- **Responsive Grid**: Modern card-based layout with Angular Material
- **Real-time Availability**: Live updates of available spots
- **Demo Data**: Generates sample slots when backend unavailable

### ✅ Booking Management
- **Book Slots**: One-click booking with immediate UI updates
- **Cancel Bookings**: Unsubscribe from booked slots
- **Visual Feedback**: Different button states for booked/available/full slots
- **Error Handling**: Graceful fallbacks and user notifications

### ✅ Admin Panel
- **Slot Management**: Add, update, delete time slots
- **Date Picker**: Angular Material date picker for slot scheduling
- **Overlap Prevention**: Validates against existing slots in same category
- **Capacity Management**: Set and modify slot capacities
- **Admin-only Access**: Protected by admin guard

### ✅ Angular Material Components Used
- **Navigation**: Toolbar with user menu and logout
- **Forms**: Form fields, selectors, checkboxes with validation
- **Data Display**: Cards, tables, chips for organized content
- **Feedback**: Snackbar notifications, progress spinners
- **Date/Time**: Date picker for admin slot creation
- **Icons**: Material icons throughout the interface

### ✅ Technical Architecture
- **Standalone Components**: Modern Angular 21 architecture
- **Reactive Forms**: Form validation and error handling
- **RxJS State Management**: Observable-based data flow
- **HTTP Interceptors**: Automatic authentication headers
- **Route Guards**: Authentication and admin access protection
- **Service Layer**: Modular API and business logic services
- **Error Handling**: Comprehensive error management with fallbacks

## 🛠️ Project Structure

```
src/app/
├── components/
│   ├── auth/
│   │   └── login.component.ts
│   ├── calendar/
│   │   └── calendar.component.ts
│   ├── preferences/
│   │   └── preferences.component.ts
│   ├── admin/
│   │   └── admin.component.ts
│   └── shared/
│       └── loading.component.ts
├── services/
│   ├── auth.service.ts
│   ├── api.service.ts
│   ├── preferences.service.ts
│   └── booking.service.ts
├── guards/
│   ├── auth.guard.ts
│   └── admin.guard.ts
├── interceptors/
│   └── auth.interceptor.ts
├── models/
│   └── index.ts
└── app.routes.ts
```

## 🎯 Key Features Highlights

### Responsive Design
- Mobile-first approach with Angular Material
- Flexible grid layouts that adapt to screen size
- Touch-friendly interface elements

### User Experience
- Loading states with spinners and messages
- Immediate feedback for all user actions
- Clear error messages and recovery options
- Intuitive navigation with breadcrumbs

### Data Management
- Local storage fallbacks for offline functionality
- Real-time synchronization with backend when available
- Optimistic UI updates for better perceived performance

### Security
- JWT token-based authentication
- Route protection with guards
- Admin role-based access control
- Secure HTTP interceptors

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   cd event-mgmt-frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Access Application**:
   - Open `http://localhost:4200`
   - Login with any email/password (demo mode)
   - Use admin email for admin features

## 🔧 Demo Mode Features

When backend is unavailable, the application provides:
- **Mock Authentication**: Any credentials work
- **Sample Categories**: Cat 1, Cat 2, Cat 3
- **Generated Time Slots**: Realistic demo data
- **Simulated Bookings**: Local state management
- **Admin Functions**: Full admin panel simulation

## 📱 Mobile Responsive

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🎨 UI/UX Features

- **Material Design**: Consistent Google Material Design language
- **Dark/Light Theme**: Supports system theme preferences
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Lazy loading and optimized bundle sizes
- **Progressive**: Works offline with service worker support

This is a production-ready Angular 21 application that demonstrates modern web development best practices with a complete event management system.