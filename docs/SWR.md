# Software Requirements (SWR) - Believers Task Flow

## 1. Technical Requirements
- **Runtime Environment**: Android 8.0+ (via WebView).
- **Core Languages**: HTML5, CSS3, JavaScript (ES6).
- **Persistence Layer**: `window.localStorage`.
- **API Connectivity**: GROQ LLM API (HTTPS required for AI features).

## 2. Data Models (Local Storage)
### 2.1 Task Object
```json
{
  "id": "uuid",
  "text": "string",
  "category": "spiritual | personal | service",
  "completed": "boolean",
  "createdAt": "timestamp"
}
```

### 2.2 Prayer Log
```json
{
  "date": "YYYY-MM-DD",
  "minutes": "number",
  "notes": "string"
}
```

## 3. UI/UX Specifications
- **Responsive Breakpoints**: 320px, 480px (optimized for mobile portrait).
- **Interactive Elements**: Large touch targets (min 44x44px).
- **Animations**: CSS transitions for task completion (strikethrough) and view switching.

## 4. Security & Privacy
- **API Keys**: GROQ API key must be provided via a secure environment variable or a one-time setup screen (not hardcoded).
- **Data Privacy**: No task data is sent to external servers except for anonymous snippets sent to GROQ for recommendations.

## 5. Performance
- **Initial Load Time**: < 1s on modern mobile devices.
- **Offline Reliability**: 100% of core CRUD functionality must work without a network connection.
