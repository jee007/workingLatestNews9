
# Prompt for Building a Mobile News Application

## Project Overview

The goal is to develop a cross-platform mobile application (for iOS and Android) that serves as a companion to our existing news website, LatestNews9.com. The mobile app will connect to the same Firebase backend, leveraging its existing data, caching mechanisms, and AI features. The app should provide a clean, native, and user-friendly experience for reading news.

## Core App Functionality

1.  **News Feed:**
    *   The main screen should display a feed of the latest news articles, presented as clear, tappable cards.
    *   Each card should show the article's cover image, category, title, a short summary, and the publication date.

2.  **Country and Category Filtering:**
    *   Users must be able to switch the news feed content by selecting a country (USA, India, Pakistan, Saudi Arabia). This selection should persist across app sessions.
    *   Users must be able to filter the articles by category (National, World, Business, Sports, etc.), just like on the website.

3.  **Article Detail View:**
    *   Tapping an article card should navigate to a full-screen detail view.
    *   This view should display the full article content, including the header image, title, author, and publication date.

4.  **AI-Powered Features (on the article detail screen):**
    *   **Continue Reading:** If an article only has a summary, a "Continue Reading" button should be present. Tapping it should call a Firebase Function to generate the full article text using the Gemini API and display it.
    *   **Text-to-Speech:** A button should allow the user to generate an audio version of the article summary. This will call another Firebase Function. The app should then play the returned audio using a native audio player interface.

5.  **Bookmarking:**
    *   Users must be able to bookmark articles for later reading.
    *   Bookmarked articles should be saved locally on the device.
    *   A dedicated "Bookmarks" screen should display a list of all saved articles.

## Backend and Firebase Integration Details

This is the most critical part. The mobile app **must** integrate with our existing Firebase project to ensure data consistency and to leverage the backend logic we've already built.

### 1. Connecting to Firebase

You will be provided with the Firebase mobile app configuration (google-services.json for Android and GoogleService-Info.plist for iOS). Use the standard Firebase SDKs for mobile development to connect to our project.

### 2. How Data Fetching and Caching Works

The mobile app **should not** call the Newsdata.io API directly. Instead, it must read from the cache in our Firestore database, which is populated by our existing web server.

*   **Firestore Path for Articles:** `/newsCache/{countryCode}`
    *   To get news for the United States, listen for real-time updates on the document: `db.collection('newsCache').doc('us')`.
    *   This document contains an `articles` array and a `lastFetched` timestamp. The mobile app should use this `articles` array to populate its news feed.
    *   The web server automatically refreshes this cache every 30 minutes. The mobile app will receive these updates automatically by listening to the document.

### 3. How AI Features Work

The AI features are exposed via callable Firebase Functions, which you will need to create. These functions will reuse the Genkit flow logic from our web application's backend.

*   **Firebase Function: `generateFullArticle`**
    *   **Trigger:** Callable from the mobile app.
    *   **Input:** `{ title: string, description: string }`
    *   **Logic:** This function should import and call the `generateFullArticle` Genkit flow from our web backend. It will call the Gemini API to generate the text.
    *   **Output:** `{ fullArticleText: string }`
    *   **Caching:** The function should save the result to the `/generatedArticles/{sanitizedArticleId}` document in Firestore to avoid re-generating it in the future.

*   **Firebase Function: `generateAudioFromText`**
    *   **Trigger:** Callable from the mobile app.
    *   **Input:** `{ text: string }`
    *   **Logic:** This function should import and call the `generateAudioFromText` Genkit flow. It will call the Gemini Text-to-Speech API.
    *   **Output:** `{ audioDataUri: string }` (A base64 encoded WAV audio file as a data URI). The mobile app will need to decode this and play it.

### 4. How API Key Rotation Works (Backend Logic)

The mobile app does not need to manage API keys. This is handled entirely by our existing web backend. For your reference, here is how it works:

*   API keys (for both Newsdata.io and Gemini) are stored in the `/settings/apiKeys` document in Firestore.
*   The web server reads this document to get the keys it needs for API calls.
*   For the Newsdata.io API, if key rotation is enabled in the settings, the server cycles through the available keys for each fetch, updating its state in the `/settings/apiState` document.
*   **Conclusion for Mobile:** The mobile app only needs to call the Firebase Functions (`generateFullArticle`, `generateAudioFromText`) and read from the `/newsCache` collection. It never needs to know what the API keys are.

## Required Screens

1.  **Main Feed Screen:** Scrollable list of article cards. Should have a prominent country selector.
2.  **Category/Filter View:** A way to select a news category (e.g., a slide-out menu or a horizontal scrolling bar).
3.  **Article Detail Screen:** Displays the full article, with buttons for AI features and bookmarking.
4.  **Bookmarks Screen:** A list of locally saved articles.

## Tech Stack Recommendation

*   **Framework:** Use a modern, cross-platform framework like React Native or Flutter.
*   **Firebase SDKs:** Use the official Firebase SDKs for Firestore and Functions.
*   **Local Storage:** Use a reliable method for local persistence for bookmarks (e.g., SQLite, SharedPreferences, AsyncStorage).

This prompt provides all the necessary architectural details for another AI to build a mobile app that works seamlessly with your current system.
