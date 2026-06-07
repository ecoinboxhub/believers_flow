# Believers Task Flow

**Believers Task Flow** is a lightweight Christian task manager and spiritual growth tracker. Built with a focus on simplicity and faith, it helps you manage your daily responsibilities while keeping your spiritual walk at the center.

## 🌟 Features
- **Lightweight To-Do**: Add, complete, and filter tasks with zero bloat.
- **Prayer Tracker**: Log your daily prayer time and stay consistent.
- **Bible Study Planner**: Plan and track your scripture reading.
- **Christian Task Balancer**: Visualize how your day is balanced between spiritual and daily tasks.
- **Offline-First**: Your data stays on your device using `localStorage`.
- **AI Recommendations**: Get activity suggestions powered by GROQ LLM.

## 🚀 Getting Started

### Local Development (Web)
1. Clone the repository.
2. Open `www/index.html` in any modern web browser.
3. To enable AI features, create a `.env` file (or set via UI) with your `GROQ_API_KEY`.

### Build Android APK
1. Ensure you have **Java JDK** and **Android SDK/Gradle** installed.
2. Navigate to the `android/` directory.
3. Run the Gradle build:
   ```bash
   ./gradlew assembleRelease
   ```
4. The signed APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.
5. A copy will be placed in the project root as `believersguidelite.apk`.

## 🛠 Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS
- **Native Wrapper**: Android WebView
- **Build System**: Gradle
- **AI Integration**: GROQ API

## 📂 Project Structure
- `www/`: Web application source code.
- `android/`: Android Studio project.
- `docs/`: Product documentation (PRD, SWR, etc.).
- `believersguidelite.apk`: Production-ready APK.

## 📝 License
This project is open-source and intended for the benefit of the believer community.
