export default function GuidePanel({ onClose }) {
  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide-panel" onClick={e => e.stopPropagation()}>
        <div className="guide-header">
          <span className="guide-title">Faith Assistant User Guide</span>
          <button className="guide-close" onClick={onClose}>✕</button>
        </div>
        <div className="guide-body">
          <div className="guide-section">
            <h4>What is the AI Assistant?</h4>
            <p>The Faith Assistant is a conversational AI designed to provide scripture-based guidance, prayer support, and life advice from a Christian perspective. It can help you reflect on your faith, explore scripture, and receive encouragement in daily life.</p>
          </div>
          <div className="guide-section">
            <h4>What It Can Do</h4>
            <ul>
              <li>Share inspirational Bible verses and words of encouragement.</li>
              <li>Answer questions about faith, scripture, and spiritual practices.</li>
              <li>Offer prayer guidance and support.</li>
              <li>Provide life advice and practical guidance from a Christian perspective.</li>
              <li>Assist with personal tasks and spiritual goals.</li>
            </ul>
          </div>
          <div className="guide-section">
            <h4>Privacy and Data Handling</h4>
            <p>Your conversations are stored locally within the app. No personal chats are shared externally, except for generating AI responses. The AI operates securely and privately, respecting your data at all times.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
