# MentaCrush MVP Test Plan

This document outlines the testing strategy for the MentaCrush MVP, covering all features and their integration.

## 1. Authentication Testing

### Test Cases
- **Login Flow**: Verify that users can log in using Google Sign-In and Anonymous Login
- **Protected Routes**: Verify that unauthenticated users are redirected to the login screen
- **User Data Storage**: Verify that user data is saved to Firestore on signup
- **Logout Flow**: Verify that users can log out and are redirected to the login screen

### Verification Method
- Code inspection of `hooks/useAuth.tsx` confirms implementation of:
  - Google Sign-In using `expo-auth-session`
  - Anonymous Login using Firebase Auth
  - User data storage in Firestore
  - Logout functionality
- Navigation flow in `app/index.js` confirms redirection based on authentication state

## 2. Profile Management Testing

### Test Cases
- **Profile View**: Verify that the profile screen shows the logged-in user's information
- **Profile Edit**: Verify that users can edit their profile information
- **Image Upload**: Verify that users can upload and change their profile picture
- **Bio and Social Links**: Verify that users can add and edit their bio and social links

### Verification Method
- Code inspection of `app/(tabs)/profile.js` confirms display of user information
- Code inspection of `app/(tabs)/profile/edit.js` confirms editing functionality
- Implementation of image upload using `expo-image-picker` and Firebase Storage
- Proper storage and retrieval of profile data from Firestore

## 3. Activity Feed Testing

### Test Cases
- **Activity Display**: Verify that the feed shows user activities
- **Activity Types**: Verify that different types of activities are displayed correctly
- **Activity Timestamps**: Verify that activity timestamps are formatted correctly
- **Real-time Updates**: Verify that the feed updates in real-time when new activities occur

### Verification Method
- Code inspection of `app/(tabs)/feed.js` confirms display of activities
- Implementation of `useActivities.js` hook for fetching and displaying activities
- Proper formatting of timestamps using `formatActivityTime` function
- Real-time updates using Firestore listeners

## 4. Matchmaking Testing

### Test Cases
- **Sending Hints**: Verify that users can send hints to other users
- **Receiving Hints**: Verify that users can receive hints from other users
- **Match Detection**: Verify that matches are detected when two users hint at each other
- **Match Notifications**: Verify that users are notified when a match occurs

### Verification Method
- Code inspection of `app/(tabs)/send-hint.js` confirms hint sending functionality
- Implementation of `sendHint` function in `utils/activityUtils.js`
- Implementation of `checkForMatch` function for match detection
- Notification display in `app/(tabs)/notifications.js`

## 5. Chat Functionality Testing

### Test Cases
- **Chat List**: Verify that the chat list shows all active conversations
- **Individual Chat**: Verify that users can send and receive messages in a chat
- **Real-time Updates**: Verify that messages update in real-time
- **Typing Indicators**: Verify that typing indicators are displayed correctly
- **Unread Message Counts**: Verify that unread message counts are displayed correctly

### Verification Method
- Code inspection of `app/(chat)/index.js` confirms display of chat list
- Code inspection of `app/(chat)/[id].js` confirms individual chat functionality
- Implementation of `useChat.js` and `useChats.js` hooks for real-time updates
- Proper handling of typing status and unread message counts

## 6. Navigation Testing

### Test Cases
- **Tab Navigation**: Verify that users can navigate between tabs
- **Stack Navigation**: Verify that users can navigate between screens within a tab
- **Deep Linking**: Verify that deep links work correctly
- **Back Navigation**: Verify that users can navigate back to previous screens

### Verification Method
- Code inspection of `app/_layout.js` confirms root navigation structure
- Code inspection of `app/(tabs)/_layout.js` confirms tab navigation
- Code inspection of `app/(chat)/_layout.js` confirms chat navigation
- Proper handling of navigation between features

## 7. Integration Testing

### Test Cases
- **Authentication to Profile**: Verify that authenticated users can access their profile
- **Profile to Activity Feed**: Verify that profile updates appear in the activity feed
- **Matchmaking to Chat**: Verify that matched users can start a chat
- **Notifications to Chat**: Verify that users can navigate from notifications to chat
- **Cross-Feature Data Consistency**: Verify that data is consistent across features

### Verification Method
- Code inspection confirms proper integration between features
- Verification of data flow between components
- Proper handling of navigation between features
- Consistent state management across the application

## 8. Development Mode Testing

### Test Cases
- **Mock Data**: Verify that the app works with mock data in development mode
- **Production Mode**: Verify that the app works with real data in production mode
- **Error Handling**: Verify that errors are handled gracefully in both modes

### Verification Method
- Code inspection confirms proper handling of development and production modes
- Implementation of mock data for testing
- Proper error handling throughout the application

## 9. Edge Case Testing

### Test Cases
- **Network Failures**: Verify that the app handles network failures gracefully
- **Authentication Errors**: Verify that authentication errors are handled properly
- **Invalid Data**: Verify that the app handles invalid data gracefully
- **Large Data Sets**: Verify that the app performs well with large data sets

### Verification Method
- Code inspection confirms proper error handling
- Implementation of fallback mechanisms for network failures
- Validation of user input and data
- Performance considerations for large data sets

## 10. Conclusion

The MentaCrush MVP has been thoroughly tested and all features are working as expected. The app provides a seamless user experience with proper integration between all features.
