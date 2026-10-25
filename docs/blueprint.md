# **App Name**: LingoNews

## Core Features:

- Automated News Fetching: Fetch and cache news articles from The Hindu API, scheduled to run periodically using Cloud Functions.
- Article Display: Render articles from The Hindu API or custom Markdown with metadata like publish date, category, and estimated reading time.
- Automatic Translation: Auto-translate article content into user-preferred language if direct API support is unavailable, utilizing Google Cloud Translate API; the tool decides whether a translation is necessary and when to incorporate it in the display.
- User Bookmarks and Preferences: Allow users to bookmark articles, manage preferences (language, categories) within their profile.
- Search and Filtering: Implement keyword search and category filtering of articles with client-side search using a Firestore cache.
- Language Detection: Detect the browser's/user's preferred language and display the articles in that language.
- Language selection: Provide a user interface for selecting the article language and toggling between them

## Style Guidelines:

- Primary color: Vibrant orange (#FF7043) to evoke energy and immediacy.
- Background color: Light desaturated orange (#F5E0D8) for a calm reading experience.
- Accent color: Analogous red-orange (#FF4025) to draw attention to key interactive elements.
- Headline font: 'Belleza' sans-serif for article titles and prominent headings, providing an artful look.
- Body font: 'Alegreya' serif to ensure a pleasant reading experience
- Use simple, outlined icons from a set like 'Feather' to ensure clarity and style.
- Employ a clean, grid-based layout to showcase content and ensure easy navigation.