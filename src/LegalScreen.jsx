import { useState } from 'react'

const LEGAL_DOCS = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we collect, use, and protect your personal data.',
    content: `Privacy Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. Information We Collect

1.1 Account Information (Optional)

When you create an account, we collect your email address, name, and a securely hashed version of your password. This information is stored in our database and is used solely for account management and authentication. You are not required to create an account to use the core features of BelieversFlow.

1.2 User-Generated Content

Tasks, prayer logs, diary entries, Bible highlights, and other personal data you create within the app are stored locally on your device by default. This data never leaves your device unless you explicitly choose to enable cloud sync. We have no access to your locally stored data.

1.3 Cloud Sync Data (Opt-In Only)

If you create an account and enable cloud sync, your data is transmitted to and stored in our secure database. This is entirely optional. You can disable cloud sync at any time, and your locally stored data will remain on your device.

1.4 AI Feature Data

When you use AI-powered features such as verse explanation, commentary, or the faith assistant, your queries are processed by third-party AI services. These queries are not used to train AI models. We retain query logs for up to 30 days for quality improvement purposes, after which they are permanently deleted.

1.5 Device Information

We collect basic device information such as app version and device type. This information is used solely for improving app performance and is not shared with third parties.


2. How We Use Your Information

We use the information we collect to provide and improve the BelieversFlow experience, personalize your content, process any subscriptions you may purchase, send important service-related communications, and maintain the security of our platform.


3. Data Sharing

We do not sell, rent, or trade your personal data. We share information only with essential service providers who help us operate the platform: our hosting provider for app infrastructure, our database provider for secure data storage, and our AI providers for processing faith-related queries. Each of these providers is bound by strict data protection agreements.


4. Data Security

We take the security of your data seriously. Passwords are encrypted using industry-standard hashing algorithms. All data transmitted between your device and our servers is encrypted using TLS technology. Our database employs encryption at rest. We conduct regular security reviews of our systems and practices.


5. Your Rights

You have the right to request a copy of all data we hold about you, request deletion of your data, export your data in a portable format, correct any inaccurate information, and object to certain types of data processing. To exercise any of these rights, please contact us using the information provided at the end of this policy.


6. Data Retention

We retain your account data until you request deletion. AI interaction data is automatically deleted after 30 days. Security logs are retained for 12 months for protection purposes. If you delete your account, all associated data is permanently removed from our systems.


7. Children's Privacy

BelieversFlow is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take immediate steps to delete it.


8. International Data Transfers

Your data may be processed in countries outside your own jurisdiction. We ensure that appropriate safeguards are in place to protect your data regardless of where it is processed.


9. Changes to This Policy

We may update this Privacy Policy from time to time. When we make significant changes, we will notify you through the app or by email. Your continued use of BelieversFlow after changes are posted constitutes acceptance of the updated policy.


10. Contact Us

If you have questions about this Privacy Policy or how we handle your data, please contact us at privacy@believersflow.app`
  },
  {
    id: 'tos',
    title: 'Terms of Service',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Legal agreement between you and BelieversFlow.',
    content: `Terms of Service

Effective Date: July 7, 2026
Version: 1.1.0


1. Acceptance of Terms

By accessing or using BelieversFlow, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.


2. Description of Service

BelieversFlow is a Christian lifestyle application that provides task management with faith-centered organization, prayer tracking and spiritual growth tools, a Bible reader with multiple translations, AI-powered faith guidance and commentary, a hymn library with over one thousand hymns, daily devotionals, and optional cloud synchronization across your devices.


3. User Accounts

You may use BelieversFlow without creating an account. All core features are available in local-only mode. Creating an account is optional and enables additional features such as cloud sync and AI assistance. You are responsible for maintaining the security of your account credentials. Only one account per person is permitted.


4. Acceptable Use

You agree to use BelieversFlow for its intended purpose as a Christian spiritual growth tool. You agree to treat all users with respect and kindness. You agree not to use the service for any illegal activities, not to attempt to disrupt or compromise the service, not to impersonate others, and not to share content that is harmful, hateful, or inappropriate for a Christian audience.


5. Intellectual Property

BelieversFlow and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws. You retain full ownership of any content you create within the app. Bible scripture content is in the public domain. Hymn lyrics may be subject to copyright held by their respective authors or publishers.


6. AI Features

BelieversFlow includes AI-powered features that provide faith-related guidance, verse explanations, and commentary. These features are powered by third-party AI models. AI-generated responses are provided for informational and inspirational purposes only and are not a substitute for professional spiritual counsel, medical advice, legal advice, or any other professional guidance. We do not guarantee the accuracy of AI-generated content.


7. Subscriptions

The core features of BelieversFlow are free to use. Future premium features may require a paid subscription. Subscription terms, pricing, and payment processing details will be clearly communicated before any purchase is required. You may cancel your subscription at any time.


8. Disclaimer of Warranties

BelieversFlow is provided on an as-is and as-available basis. We make no warranties, expressed or implied, regarding the reliability, availability, or suitability of the service for any particular purpose. We do not warrant that the service will be uninterrupted, error-free, or completely secure.


9. Limitation of Liability

To the fullest extent permitted by law, BelieversFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service. Our total liability shall not exceed the amount you have paid us in the twelve months preceding the claim.


10. Termination

We reserve the right to suspend or terminate your account if you violate these Terms of Service, engage in conduct that is harmful to other users or the platform, or for any other reason at our sole discretion with reasonable notice.


11. Governing Law

These Terms of Service are governed by and construed in accordance with applicable law. Any disputes arising from these terms shall be resolved through good-faith negotiation first, followed by mediation if necessary.


12. Changes to These Terms

We may update these Terms of Service from time to time. When we make material changes, we will notify you through the app or by email. Your continued use of BelieversFlow after changes are posted constitutes acceptance of the updated terms.


13. Contact Us

If you have questions about these Terms of Service, please contact us at support@believersflow.app`
  },
  {
    id: 'tou',
    title: 'Terms of Use',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Rules for using BelieversFlow and its community features.',
    content: `Terms of Use

Effective Date: July 7, 2026
Version: 1.1.0


1. Overview

These Terms of Use govern how you interact with BelieversFlow and its features. By using the application, you agree to follow these guidelines, which are rooted in Christian values of love, respect, and kindness.


2. User Conduct

2.1 Christian Community Standards

BelieversFlow is a faith-based platform. We ask all users to treat one another with love, respect, and kindness as taught in Scripture. Avoid speech or behavior that is hateful, discriminatory, or harassing. Share content that is appropriate for a Christian audience and focused on unity in Christ.


2.2 Prohibited Behavior

The following behaviors are not permitted: hate speech or discrimination of any kind, harassment or bullying of other users, spam or unsolicited advertisements, impersonation of other individuals or organizations, sharing of illegal or harmful content, and any attempt to disrupt or compromise the integrity of the service.


3. Content Guidelines

3.1 User Content

You own all content you create within BelieversFlow. Your content should be appropriate for a Christian audience and should not contain the private information of others without their consent. Respect the intellectual property rights of others when sharing content.


3.2 AI-Generated Content

AI-powered features in BelieversFlow generate responses for informational and inspirational purposes. These responses may occasionally contain errors or inaccuracies. AI is not a substitute for professional spiritual counsel or any form of professional advice. Do not rely solely on AI-generated content for critical decisions.


3.3 Bible and Scripture

Bible content within BelieversFlow is presented in various public domain translations. We ask that you use scripture respectfully and accurately, and that you do not misrepresent or take scripture out of context.


4. Community Features

4.1 Prayer and Devotional Features

BelieversFlow provides personal prayer tracking and devotional features. Prayer logs and personal devotional content are private to each user and are not shared with others unless you explicitly choose to share them.


4.2 Hymns and Music

The hymn library is provided for personal worship and spiritual enrichment. Hymn audio is generated through your device and is not downloaded or distributed. Please respect the copyright of hymn authors and publishers.


5. Enforcement

We reserve the right to take appropriate action when these Terms of Use are violated. Actions may include removing violating content, restricting access to certain features, suspending accounts temporarily, or terminating accounts for serious or repeated violations.


6. Reporting Violations

If you encounter behavior or content that violates these Terms of Use, please report it to report@believersflow.app. We will review all reports promptly and take appropriate action.


7. Changes to These Terms

We may update these Terms of Use from time to time. When we make changes, we will notify you through the app. Your continued use of BelieversFlow after changes are posted constitutes acceptance of the updated terms.


8. Contact Us

If you have questions about these Terms of Use, please contact us at support@believersflow.app`
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How to behave in the BelieversFlow community.',
    content: `Community Guidelines

Effective Date: July 7, 2026
Version: 1.1.0


1. Our Values

BelieversFlow is built on Biblical principles that guide how we interact with one another. These values shape our community:

Love: We are called to love one another as Christ loved us (John 13:34). Every interaction should be rooted in genuine care and compassion.

Respect: We show respect to all users, honoring one another above ourselves (Romans 12:10). This means listening, being considerate, and valuing different perspectives.

Kindness: We are encouraged to be kind and compassionate to one another (Ephesians 4:32). Kindness is expressed through our words, actions, and attitudes.

Truth: We speak the truth in love (Ephesians 4:15). Honesty and integrity are foundational to our community.

Encouragement: We build one another up with words of hope and support (1 Thessalonians 5:11). Everyone needs encouragement on their faith journey.


2. Acceptable Behavior

We encourage you to: support and uplift other users through kind and thoughtful interactions, share prayer requests and testimonies that build community, ask questions and seek spiritual growth together, celebrate blessings and answered prayers, and offer scripture-based encouragement to those who are struggling.


3. Prohibited Behavior

The following behaviors undermine our community and are not permitted: hate speech, discrimination, or prejudice of any kind, harassment, bullying, or intimidation, spam, unsolicited advertising, or commercial solicitation, spreading misinformation or false teachings, impersonating other users or leaders, sharing private or personal information of others without consent, and any content that promotes harm, violence, or illegal activity.


4. Content Standards

All content shared within BelieversFlow should be appropriate for a Christian audience. Use language that is respectful, wholesome, and edifying. Ensure that shared content is truthful and accurate. Avoid content that is divisive, provocative, or designed to cause conflict.


5. Reporting Violations

If you encounter content or behavior that violates these guidelines, please report it to report@believersflow.app. All reports are reviewed confidentially. We ask that you do not engage directly with violating content but instead allow our team to address it.


6. Enforcement

We take community standards seriously. When violations occur, we may: issue a written warning for minor violations, remove content that violates these guidelines, restrict access to certain features for repeated violations, suspend accounts temporarily for serious violations, and terminate accounts for severe or persistent violations. We aim to restore rather than punish, but we will protect the integrity of our community.


7. Contact Us

If you have questions about these Community Guidelines or need to report a concern, please contact us at community@believersflow.app`
  },
  {
    id: 'data-collection',
    title: 'Data Collection Disclosure',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Complete disclosure of all data we collect and why.',
    content: `Data Collection Disclosure

Effective Date: July 7, 2026
Version: 1.1.0


What We Collect and Why

Email Address: Optional. Used for account management and authentication. Stored until you request deletion.

Name: Optional. Used for display purposes within the app. Stored until you request deletion.

Password: Optional. Securely hashed for authentication. Stored until you request deletion.

Tasks: Optional. Core feature data stored locally on your device. Only synced to our servers if you enable cloud sync.

Prayer Logs: Optional. Core feature data stored locally on your device. Only synced if cloud sync is enabled.

Diary Entries: Optional. Core feature data stored locally on your device. Only synced if cloud sync is enabled.

Bible Highlights: Optional. Core feature data stored locally on your device. Only synced if cloud sync is enabled.

AI Chat Messages: Optional. Processed by AI providers for faith-related guidance. Deleted after 30 days. Not used for AI training.


How We Protect Your Data

Passwords are encrypted using industry-standard hashing. All data in transit is protected with TLS encryption. Our database uses encryption at rest. We conduct regular security reviews.


Your Rights

You have the right to access your data, delete your data, export your data in a portable format, and correct any inaccurate information.


Contact

For questions about data collection, contact us at privacy@believersflow.app`
  },
  {
    id: 'security',
    title: 'Security Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we protect your data and the BelieversFlow platform.',
    content: `Security Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. Our Commitment

BelieversFlow is committed to protecting the security and privacy of our users. We implement industry-standard security measures to safeguard your data and maintain the integrity of our platform.


2. Authentication Security

2.1 Password Protection

All passwords are hashed using bcrypt, an industry-standard hashing algorithm. We never store passwords in plain text. Passwords must meet minimum complexity requirements.

2.2 JWT Tokens

We use JSON Web Tokens (JWT) for session management. Access tokens expire after 15 minutes and require refresh. Refresh tokens expire after 30 days. Compromised tokens can be immediately revoked through our token blocklist system.

2.3 Brute-Force Protection

We implement rate limiting and account lockout mechanisms to prevent brute-force attacks. After 5 failed login attempts, accounts are temporarily locked for 15 minutes to protect against unauthorized access.


3. Data Security

3.1 Encryption in Transit

All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security) encryption.

3.2 Encryption at Rest

Our database employs encryption at rest to protect stored data.

3.3 Data Isolation

User data is isolated through proper authorization checks. Each user can only access their own data.


4. Infrastructure Security

4.1 Regular Updates

We keep all software dependencies up to date and apply security patches promptly.

4.2 Access Controls

Administrative access to our systems is strictly limited and monitored.

4.3 Logging and Monitoring

We maintain comprehensive logs for security monitoring and incident response.


5. API Security

5.1 Input Validation

All user input is validated using strict schemas to prevent injection attacks.

5.2 Rate Limiting

API endpoints are rate-limited to prevent abuse and denial-of-service attacks.

5.3 CORS Protection

Cross-Origin Resource Sharing (CORS) is configured to restrict access to authorized origins only.


6. Vulnerability Management

6.1 Security Audits

We conduct regular security audits of our codebase and infrastructure.

6.2 Dependency Monitoring

We monitor our dependencies for known vulnerabilities and update them promptly.

6.3 Responsible Disclosure

If you discover a security vulnerability, please report it to security@believersflow.app. We will respond within 48 hours and work with you to address the issue.


7. Incident Response

In the event of a security incident, we will: immediately investigate and contain the incident, notify affected users within 72 hours, provide details about what data was affected, and implement measures to prevent recurrence.


8. Contact Us

For security concerns or to report a vulnerability, please contact us at security@believersflow.app`
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we use cookies and similar technologies.',
    content: `Cookie Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. What Are Cookies

Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.


2. How We Use Cookies

BelieversFlow is primarily a mobile application, but we may use cookies and similar technologies in the following contexts:

2.1 Web Version

If you access BelieversFlow through a web browser, we may use cookies for: authentication and session management, remembering your preferences and settings, and security purposes such as preventing cross-site request forgery.

2.2 Analytics

We may use cookies to collect anonymous usage statistics to help us improve the application. This data does not identify you personally. Analytics features are planned for future implementation.


3. Types of Cookies We Use

3.1 Essential Cookies

These cookies are necessary for the application to function properly. They enable core features such as authentication and security.

3.2 Preference Cookies

These cookies remember your settings and preferences to provide a personalized experience.

3.3 Analytics Cookies

These cookies help us understand how users interact with the application by collecting anonymous usage data.


4. Third-Party Cookies

We may use third-party services that set their own cookies, including: analytics services to understand usage patterns, and AI services for processing faith-related queries.


5. Managing Cookies

You can control and manage cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the application.

5.1 Browser Settings

Most web browsers allow you to: view and delete cookies, block third-party cookies, block cookies from particular sites, and block all cookies.

5.2 Impact of Disabling Cookies

If you disable cookies, some features of BelieversFlow may not function properly, including: maintaining your login session and remembering your preferences.


6. Data Retention

Cookies are retained for different periods depending on their purpose: session cookies are deleted when you close your browser, persistent cookies remain until their expiration date or until you delete them, and security cookies may be retained longer for fraud prevention.


7. Changes to This Policy

We may update this Cookie Policy from time to time. When we make changes, we will notify you through the app. Your continued use of BelieversFlow after changes are posted constitutes acceptance of the updated policy.


8. Contact Us

If you have questions about our Cookie Policy, please contact us at privacy@believersflow.app`
  },
  {
    id: 'content-moderation',
    title: 'Content Moderation Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we moderate content to maintain a safe community.',
    content: `Content Moderation Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. Our Approach

BelieversFlow is committed to maintaining a safe, respectful, and faith-centered community. We moderate content to ensure it aligns with our Christian values and community standards.


2. What We Moderate

2.1 User-Generated Content

We review content that is shared publicly or with other users, including: shared prayer requests (when implemented), and AI-generated content shared through the application.

2.2 AI-Generated Content

AI responses are monitored for: accuracy and alignment with Christian teachings, appropriate and respectful language, and avoidance of harmful or misleading information.


3. Moderation Methods

3.1 Automated Systems

We use automated systems to detect and filter: spam and unsolicited advertising, hate speech and discriminatory language, and content that violates our community standards.

3.2 Human Review

Our moderation team reviews: reported content, flagged content from automated systems, and content that requires contextual understanding.

3.3 Community Reporting

Users can report content that violates our guidelines. All reports are reviewed promptly and confidentially.


4. Content That Is Not Allowed

The following content is prohibited: hate speech or discrimination based on race, ethnicity, gender, sexual orientation, religion, or disability, harassment, bullying, or intimidation, spam, advertising, or commercial solicitation, misinformation or false teachings, content that promotes harm, violence, or illegal activity, explicit or inappropriate content, and impersonation of others.


5. Enforcement Actions

When content violates our policies, we may: remove the violating content, issue a warning to the user, temporarily restrict access to certain features, suspend the user's account, or permanently terminate the account for severe violations.

5.1 Appeal Process

If you believe content was moderated in error, you can appeal by contacting us at moderation@believersflow.app. We will review your appeal within 7 days.


6. AI Content Disclaimer

AI-generated content is provided for informational and inspirational purposes only. It may occasionally contain errors or inaccuracies. AI is not a substitute for professional spiritual counsel or any form of professional advice.


7. Transparency

We provide clear guidelines about what content is acceptable. We notify users when their content is moderated and provide reasons for the action. We maintain records of moderation actions for accountability.


8. Contact Us

For questions about content moderation or to appeal a decision, please contact us at moderation@believersflow.app`
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Rules for acceptable use of BelieversFlow.',
    content: `Acceptable Use Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. Purpose

This Acceptable Use Policy outlines the rules and guidelines for using BelieversFlow. By using our application, you agree to comply with this policy.


2. Permitted Uses

BelieversFlow is designed for: personal spiritual growth and devotional activities, task management with faith-centered organization, prayer tracking and spiritual discipline, Bible study and scripture exploration, hymn worship and music appreciation, and community building among believers.


3. Prohibited Uses

You agree not to use BelieversFlow for: any illegal activities or purposes, harassment, bullying, or intimidation of other users, spreading misinformation or false teachings, distributing spam or unsolicited advertising, attempting to gain unauthorized access to our systems, interfering with or disrupting the service, impersonating others or misrepresenting your identity, sharing content that is harmful, hateful, or inappropriate, or commercial purposes without our written consent.


4. Account Responsibilities

You are responsible for: maintaining the security of your account credentials, all activities that occur under your account, notifying us immediately of any unauthorized use, and ensuring your use complies with this policy.


5. Content Standards

All content you create or share must: be appropriate for a Christian audience, be truthful and accurate, respect the privacy and rights of others, comply with applicable laws and regulations, and not contain malware or harmful code.


6. Technical Restrictions

You agree not to: reverse engineer or decompile the application, attempt to circumvent security measures, use automated tools to access the service without permission, interfere with or disrupt servers or networks, or introduce viruses or other harmful technology.


7. Enforcement

We reserve the right to investigate and take appropriate action against anyone who violates this policy, including: removing violating content, suspending or terminating accounts, reporting illegal activity to law enforcement, and pursuing legal remedies for damages.


8. Reporting Violations

To report a violation of this policy, please contact us at abuse@believersflow.app. Include as much detail as possible about the violation.


9. Changes to This Policy

We may update this Acceptable Use Policy from time to time. When we make changes, we will notify you through the app. Your continued use of BelieversFlow after changes are posted constitutes acceptance of the updated policy.


10. Contact Us

For questions about this Acceptable Use Policy, please contact us at legal@believersflow.app`
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Third-party services we use and their data practices.',
    content: `Third-Party Services Disclosure

Effective Date: July 7, 2026
Version: 1.1.0


1. Overview

BelieversFlow integrates with third-party services to provide certain features. This document discloses which services we use and how they handle your data.


2. AI Services

2.1 GROQ

Purpose: Powers AI features including verse explanation, commentary, and faith assistant.
Data Processed: User queries related to faith, Bible verses, and spiritual guidance.
Data Retention: Queries are not used for AI training and are deleted after 30 days.
Privacy Policy: https://groq.com/privacy/

2.2 OpenAI

Purpose: Backup AI provider for faith-related queries.
Data Processed: User queries related to faith and spiritual guidance.
Data Retention: Queries are not used for AI training and are deleted after 30 days.
Privacy Policy: https://openai.com/privacy

2.3 OpenRouter

Purpose: Additional AI provider option.
Data Processed: User queries related to faith and spiritual guidance.
Data Retention: Queries are not used for AI training and are deleted after 30 days.
Privacy Policy: https://openrouter.ai/privacy


3. Database Services

3.1 PostgreSQL

Purpose: Stores user account data and cloud-synced content.
Data Processed: User account information, synced tasks, prayer logs, and other user data.
Security: Data encrypted at rest and in transit.


4. Vector Database

4.1 Pinecone

Purpose: Powers RAG (Retrieval-Augmented Generation) for enhanced AI responses.
Data Processed: Bible verses and related content for semantic search.
Data Retention: Vector embeddings are stored for the lifetime of the service.


5. Email Services

5.1 Brevo (formerly Sendinblue)

Purpose: Sends transactional emails including password resets and email verification.
Data Processed: Email addresses for account-related communications.
Data Retention: Email records are retained for delivery confirmation.


6. Payment Services

6.1 Flutterwave

Purpose: Processes subscription payments for premium features.
Data Processed: Payment information is processed directly by Flutterwave. We only receive transaction confirmation.
PCI Compliance: Flutterwave is PCI DSS compliant.


7. Hosting Services

Purpose: Application hosting and infrastructure.
Data Processed: Application data and user traffic.
Security: Industry-standard security measures and encryption.


8. Data Sharing

We do not sell your data to any third party. We share data only as necessary to provide the services described above. All third-party providers are bound by data protection agreements.


9. Your Choices

You can use BelieversFlow without creating an account, which limits data shared with third parties. AI features require sending queries to AI providers. You can choose not to use AI features if you prefer.


10. Changes to This Disclosure

We may update this disclosure as we add or change third-party services. When we make significant changes, we will notify you through the app.


11. Contact Us

For questions about our third-party services, please contact us at privacy@believersflow.app`
  },
  {
    id: 'data-retention',
    title: 'Data Retention Policy',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How long we keep your data and when it is deleted.',
    content: `Data Retention Policy

Effective Date: July 7, 2026
Version: 1.1.0


1. Overview

This policy explains how long BelieversFlow retains different types of data and when data is deleted.


2. Account Data

2.1 Active Accounts

While your account is active, we retain: email address, name, and hashed password, preferences and settings, and cloud-synced content.

2.2 Account Deletion

When you delete your account: all personal information is permanently deleted within 30 days, cloud-synced content is permanently deleted within 7 days, and anonymized data may be retained for analytics purposes.


3. User-Generated Content

3.1 Local Storage

Data stored locally on your device remains until you delete it or uninstall the application. We have no access to locally stored data.

3.2 Cloud Sync

If you use cloud sync, your data is retained until you delete it or your account is deleted. You can disable cloud sync at any time.


4. AI Interaction Data

4.1 Query Logs

AI queries are retained for up to 30 days for quality improvement purposes. After 30 days, queries are permanently deleted. Queries are not used for AI training.

4.2 Chat History

AI chat history is stored locally on your device. If you use cloud sync, chat history may be synced to our servers and retained until you delete it.


5. Security Logs

5.1 Login Logs

Login attempts and security events are retained for 12 months for fraud prevention.

5.2 Audit Logs

System audit logs are retained for 6 months for security monitoring.


6. Analytics Data

6.1 Usage Analytics

Anonymous usage data may be retained indefinitely for product improvement purposes. This data cannot be linked to individual users.

6.2 Performance Metrics

Application performance data is retained for 12 months.


7. Email Communications

7.1 Transactional Emails

Emails sent for account purposes (password resets, verification) are logged for 30 days.

7.2 Marketing Emails

If you opt in to marketing emails, your email is retained until you unsubscribe.


8. Payment Data

8.1 Transaction Records

Payment transaction records are retained for 7 years for accounting and tax purposes.

8.2 Payment Information

Payment card information is not stored on our servers. All payment processing is handled by our PCI-compliant payment processor.


9. Data Deletion

You can request data deletion by: using the account deletion feature in the app, emailing privacy@believersflow.app, or contacting support. We will process deletion requests within 30 days.


10. Legal Requirements

We may retain data longer if required by law, for legal proceedings, or to protect our legal rights.


11. Contact Us

For questions about data retention, please contact us at privacy@believersflow.app`
  },
  {
    id: 'incident-response',
    title: 'Incident Response Plan',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we respond to security incidents and data breaches.',
    content: `Incident Response Plan

Effective Date: July 7, 2026
Version: 1.1.0


1. Purpose

This document outlines BelieversFlow's plan for responding to security incidents and data breaches to protect our users and minimize impact.


2. Incident Classification

2.1 Severity Levels

Critical: Confirmed data breach with sensitive user data exposed, system compromise, or complete service outage.

High: Attempted unauthorized access, malware detection, or significant service disruption.

Medium: Suspicious activity, minor vulnerability exploitation, or partial service degradation.

Low: Policy violations, minor security events, or unsuccessful attack attempts.


3. Response Team

3.1 Team Members

Incident Commander: Leads response efforts and coordinates team activities.

Technical Lead: Investigates the incident and implements technical fixes.

Communications Lead: Handles internal and external communications.

Legal Counsel: Advises on legal obligations and regulatory requirements.


4. Response Procedures

4.1 Detection and Analysis

Immediately assess the severity and scope of the incident. Preserve evidence for investigation. Document all findings and actions taken.

4.2 Containment

Isolate affected systems to prevent further damage. Implement temporary fixes if necessary. Maintain service availability for unaffected users.

4.3 Eradication

Remove the root cause of the incident. Apply security patches and updates. Strengthen defenses to prevent recurrence.

4.4 Recovery

Restore systems from clean backups if necessary. Verify system integrity before returning to production. Monitor for signs of continued compromise.


5. Notification

5.1 User Notification

For incidents involving user data: notify affected users within 72 hours, provide clear information about what data was affected, explain steps users should take to protect themselves, and offer support and resources.

5.2 Regulatory Notification

Comply with all applicable data protection regulations, including GDPR, CCPA, and other relevant laws.

5.3 Law Enforcement

Report criminal activity to appropriate law enforcement agencies.


6. Communication Templates

6.1 Initial Notification

We are aware of a security incident affecting our systems. We are actively investigating and will provide updates as more information becomes available.

6.2 Detailed Notification

We have identified a security incident that may have affected your personal information. The incident occurred on [DATE]. The following data may have been compromised: [DATA TYPES]. We are taking the following steps to address this: [ACTIONS]. You should take the following precautions: [USER ACTIONS].


7. Post-Incident Activities

7.1 Documentation

Document all aspects of the incident for future reference. Create a detailed incident report.

7.2 Lessons Learned

Conduct a post-incident review to identify improvements. Update security policies and procedures as needed. Implement additional safeguards to prevent similar incidents.

7.3 Follow-Up

Monitor for signs of continued compromise. Verify that all remediation steps are complete. Provide final update to affected users.


8. Contact Information

For security incidents, contact us immediately at security@believersflow.app. For urgent matters, call our security hotline.


9. Plan Review

This plan is reviewed and updated annually or after any significant incident.


10. Contact Us

For questions about our incident response procedures, please contact us at security@believersflow.app`
  },
  {
    id: 'data-compliance',
    title: 'Data Compliance',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'How we comply with data protection regulations.',
    content: `Data Compliance

Effective Date: July 7, 2026
Version: 1.1.0


1. Overview

BelieversFlow is committed to complying with applicable data protection regulations. This document explains how we meet our compliance obligations.


2. GDPR Compliance

2.1 Lawful Basis for Processing

We process data based on: consent (when you create an account or enable features), contractual necessity (to provide the service you requested), and legitimate interests (to improve our service and ensure security).

2.2 Data Subject Rights

Under GDPR, you have the right to: access your personal data, rectify inaccurate data, erase your data (right to be forgotten), restrict processing of your data, data portability, object to processing, and not be subject to automated decision-making.

2.3 Data Protection Officer

We have appointed a Data Protection Officer who can be contacted at dpo@believersflow.app.

2.4 International Transfers

When data is transferred outside the EU, we ensure appropriate safeguards are in place, including standard contractual clauses and adequacy decisions.


3. CCPA Compliance

3.1 Categories of Personal Information

We collect: identifiers (email address), commercial information (subscription purchases), internet activity (usage analytics), and geolocation data (if you enable location-based features).

3.2 Right to Know

You have the right to request: the categories of personal information we have collected, the sources of that information, the business purposes for collecting it, and the third parties with whom we share it.

3.3 Right to Delete

You have the right to request deletion of your personal information. We will comply unless an exception applies.

3.4 Right to Opt-Out

We do not sell your personal information. If this changes, we will provide a clear opt-out mechanism.


4. COPPA Compliance

4.1 Children Under 13

BelieversFlow is not directed to children under 13. We do not knowingly collect personal information from children under 13.

4.2 Parental Rights

If we discover that we have collected information from a child under 13, we will delete it immediately.


5. Other Regulations

5.1 PIPEDA (Canada)

We comply with the Personal Information Protection and Electronic Documents Act where applicable.

5.2 LGPD (Brazil)

We comply with the Lei Geral de Protecao de Dados where applicable.


6. Data Protection Measures

6.1 Technical Measures

Encryption of data in transit and at rest, access controls and authentication, regular security audits and penetration testing, and vulnerability management.

6.2 Organizational Measures

Employee training on data protection, data protection impact assessments, regular policy reviews, and incident response procedures.


7. Data Breach Response

In the event of a data breach: we will notify affected users within 72 hours, report to relevant authorities as required, provide details about the breach and affected data, and offer support and remedies.


8. Contact Us

For data protection inquiries, contact our Data Protection Officer at dpo@believersflow.app. For general privacy questions, contact privacy@believersflow.app`
  },
  {
    id: 'compliance-checklist',
    title: 'Compliance Checklist',
    version: '1.1.0',
    lastUpdated: 'July 7, 2026',
    summary: 'Our compliance commitments and certifications.',
    content: `Compliance Checklist

Effective Date: July 7, 2026
Version: 1.1.0


1. Data Protection Compliance

1.1 Privacy Policy
Status: Published and accessible
Last Updated: July 7, 2026
Location: Available in app and on website

1.2 Data Collection Disclosure
Status: Published and accessible
Last Updated: July 7, 2026
Location: Available in app and on website

1.3 Consent Mechanisms
Status: Implemented
Details: Clear consent for data collection, opt-in for cloud sync, and consent for AI features

1.4 Data Subject Rights
Status: Implemented
Details: Access, rectification, erasure, portability, and objection rights available through app and email


2. Security Compliance

2.1 Encryption
Status: Implemented
Details: TLS for data in transit, encryption at rest for database

2.2 Access Controls
Status: Implemented
Details: Authentication required, authorization checks, role-based access

2.3 Vulnerability Management
Status: Active
Details: Regular dependency updates, security audits, penetration testing

2.4 Incident Response
Status: Documented
Details: Incident response plan in place, team trained


3. Technical Security Measures

3.1 Password Security
Status: Implemented
Details: bcrypt hashing, minimum complexity requirements, brute-force protection

3.2 Session Management
Status: Implemented
Details: JWT tokens with short expiration, refresh token rotation, token blocklist

3.3 API Security
Status: Implemented
Details: Input validation, rate limiting, CORS protection, SQL injection prevention

3.4 CSRF Protection
Status: Implemented
Details: Bearer token authentication (not cookies)


4. Infrastructure Security

4.1 Server Security
Status: Implemented
Details: Regular updates, access controls, monitoring

4.2 Database Security
Status: Implemented
Details: Encryption at rest, access controls, regular backups

4.3 Network Security
Status: Implemented
Details: TLS encryption, firewall protection, DDoS mitigation


5. Content Moderation

5.1 Moderation Policy
Status: Published
Details: Clear guidelines for acceptable content

5.2 Moderation Tools
Status: Planned
Details: Automated filtering, human review, and community reporting features are planned for future implementation

5.3 Appeal Process
Status: Implemented
Details: Users can appeal moderation decisions


6. Legal Compliance

6.1 Terms of Service
Status: Published and accessible
Last Updated: July 7, 2026

6.2 Terms of Use
Status: Published and accessible
Last Updated: July 7, 2026

6.3 Cookie Policy
Status: Published and accessible
Last Updated: July 7, 2026

6.4 Acceptable Use Policy
Status: Published and accessible
Last Updated: July 7, 2026


7. Third-Party Compliance

7.1 AI Provider Agreements
Status: In place
Details: Data processing agreements with all AI providers

7.2 Payment Processor
Status: PCI DSS Compliant
Details: Flutterwave handles all payment processing

7.3 Hosting Provider
Status: Compliant
Details: Industry-standard security measures


8. User Controls

8.1 Account Deletion
Status: Implemented
Details: Users can delete their account and data through the app

8.2 Data Export
Status: Implemented
Details: Users can export their data through backup/restore feature

8.3 Privacy Settings
Status: Implemented
Details: Users can control cloud sync and AI features


9. Monitoring and Auditing

9.1 Security Logging
Status: Implemented
Details: Comprehensive logging for security monitoring

9.2 Regular Audits
Status: Planned
Details: Quarterly security reviews and annual compliance audits are planned for future implementation

9.3 Penetration Testing
Status: Planned
Details: Annual penetration testing by third-party is planned for future implementation


10. Contact Us

For compliance inquiries, please contact us at compliance@believersflow.app`
  }
]

export const LEGAL_VERSION = '1.1.0'

export default function LegalScreen({ onAccept, onDecline, mode = 'onboarding', apiUrl, authUser }) {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [accepted, setAccepted] = useState({
    privacy: false,
    tos: false,
    tou: false,
    community: false,
    'data-collection': false,
    security: false,
    cookies: false,
    'content-moderation': false,
    'acceptable-use': false,
    'third-party': false,
    'data-retention': false,
    'incident-response': false,
    'data-compliance': false,
    'compliance-checklist': false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allRequiredAccepted = accepted.privacy && accepted.tos && accepted.tou

  const handleAccept = async () => {
    if (!allRequiredAccepted) return

    setLoading(true)
    setError('')

    try {
      if (apiUrl && authUser) {
        const token = localStorage.getItem('bf_token')
        const res = await fetch(`${apiUrl}/api/auth/legal-accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            version: LEGAL_VERSION,
            accepted_at: new Date().toISOString(),
            documents: accepted
          })
        })

        if (!res.ok) {
          const data = await res.json()
          console.warn('Backend legal acceptance failed:', data.detail)
        }
      }

      localStorage.setItem('bf_legal_accepted', JSON.stringify({
        version: LEGAL_VERSION,
        accepted_at: new Date().toISOString(),
        documents: accepted
      }))

      onAccept()
    } catch (err) {
      console.warn('Legal acceptance save failed:', err)
      localStorage.setItem('bf_legal_accepted', JSON.stringify({
        version: LEGAL_VERSION,
        accepted_at: new Date().toISOString(),
        documents: accepted
      }))
      onAccept()
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = () => {
    if (mode === 'onboarding') {
      onDecline()
    }
  }

  const toggleAccept = (docId) => {
    setAccepted(prev => ({ ...prev, [docId]: !prev[docId] }))
  }

  if (selectedDoc) {
    const doc = LEGAL_DOCS.find(d => d.id === selectedDoc)
    return (
      <div className="legal-overlay">
        <div className="legal-panel legal-doc-view">
          <div className="legal-doc-header">
            <button className="legal-back-btn" onClick={() => setSelectedDoc(null)}>
              Back
            </button>
            <h2>{doc.icon} {doc.title}</h2>
          </div>
          <div className="legal-doc-content">
            <pre className="legal-doc-text">{doc.content}</pre>
          </div>
          <div className="legal-doc-footer">
            <button className="legal-btn legal-btn-secondary" onClick={() => setSelectedDoc(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="legal-overlay">
      <div className="legal-panel">
        <div className="legal-header">
          <div className="legal-logo">
            <h1>Terms and Privacy</h1>
            <p className="legal-subtitle">
              {mode === 'onboarding'
                ? 'Please review and accept our terms to continue'
                : 'Review our legal documents'
              }
            </p>
          </div>
        </div>

        <div className="legal-docs-list">
          {LEGAL_DOCS.map(doc => (
            <div key={doc.id} className="legal-doc-card">
              <div className="legal-doc-info" onClick={() => setSelectedDoc(doc.id)}>
                <span className="legal-doc-icon">{doc.icon}</span>
                <div className="legal-doc-details">
                  <h3>{doc.title}</h3>
                  <p>{doc.summary}</p>
                </div>
              </div>
              {['privacy', 'tos', 'tou'].includes(doc.id) ? (
                <label className="legal-checkbox">
                  <input
                    type="checkbox"
                    checked={accepted[doc.id]}
                    onChange={() => toggleAccept(doc.id)}
                  />
                  <span className="legal-checkmark"></span>
                  <span className="legal-checkbox-label">Required</span>
                </label>
              ) : (
                <label className="legal-checkbox">
                  <input
                    type="checkbox"
                    checked={accepted[doc.id]}
                    onChange={() => toggleAccept(doc.id)}
                  />
                  <span className="legal-checkmark"></span>
                  <span className="legal-checkbox-label">I agree</span>
                </label>
              )}
            </div>
          ))}
        </div>

        {mode === 'onboarding' && (
          <div className="legal-actions">
            {error && <div className="legal-error">{error}</div>}

            <p className="legal-required-note">
              * Required: Privacy Policy, Terms of Service, and Terms of Use
            </p>

            <div className="legal-buttons">
              <button
                className={`legal-btn legal-btn-primary${!allRequiredAccepted ? ' disabled' : ''}`}
                onClick={handleAccept}
                disabled={!allRequiredAccepted || loading}
              >
                {loading ? 'Saving...' : 'Accept & Continue'}
              </button>
              {onDecline && (
                <button className="legal-btn legal-btn-secondary" onClick={handleDecline}>
                  Decline
                </button>
              )}
            </div>
          </div>
        )}

        {mode === 'settings' && (
          <div className="legal-actions">
            <p className="legal-status">
              Accepted: {localStorage.getItem('bf_legal_accepted')
                ? `v${JSON.parse(localStorage.getItem('bf_legal_accepted')).version}`
                : 'Not yet accepted'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function hasAcceptedLegal() {
  try {
    const stored = localStorage.getItem('bf_legal_accepted')
    if (!stored) return false
    const data = JSON.parse(stored)
    return data.version === LEGAL_VERSION
  } catch {
    return false
  }
}

export function getLegalAcceptance() {
  try {
    const stored = localStorage.getItem('bf_legal_accepted')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
