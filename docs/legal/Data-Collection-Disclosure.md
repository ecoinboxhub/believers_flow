# Data Collection & Disclosure — BelieversFlow

**Document Type:** Legal / Data Disclosure
**Version:** 1.0.0
**Effective Date:** July 4, 2026
**Last Updated:** July 4, 2026
**Classification:** Public

---

> **IMPORTANT NOTICE:** This Data Collection Disclosure is a template generated for BelieversFlow. It should be reviewed by qualified legal counsel before public release. This document does not constitute legal advice.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Account Data](#2-account-data)
3. [Authentication Data](#3-authentication-data)
4. [Device Data](#4-device-data)
5. [Application Data](#5-application-data)
6. [Usage Data](#6-usage-data)
7. [AI Interaction Data](#7-ai-interaction-data)
8. [Bible Study Data](#8-bible-study-data)
9. [Devotional Data](#9-devotional-data)
10. [Music/Hymn Data](#10-musichymn-data)
11. [Community Data](#11-community-data)
12. [Payment Data](#12-payment-data)
13. [Notification Data](#13-notification-data)
14. [Location Data](#14-location-data)
15. [Media Data](#15-media-data)
16. [Third-Party Data Sharing](#16-third-party-data-sharing)
17. [Data Retention Summary](#17-data-retention-summary)
18. [Your Rights](#18-your-rights)

---

## 1. Overview

### 1.1 Purpose

This document provides a complete disclosure of all data collected by BelieversFlow. It explains:
- What data is collected
- Why each piece of data is collected
- Whether it is required or optional
- Legal basis for collection
- How long it is retained
- Where it is stored
- Whether it is encrypted
- Which third parties receive it
- Whether you can delete or export it

### 1.2 Data Collection Principles

We follow these principles:
- **Data Minimization:** We only collect what is necessary
- **Purpose Limitation:** We only use data for stated purposes
- **Transparency:** We clearly explain our practices
- **User Control:** You can access, export, and delete your data
- **Security:** We protect your data with industry-standard measures

---

## 2. Account Data

### 2.1 Email Address

| Attribute | Details |
|---|---|
| **What** | Your email address |
| **Why** | Account identification, communication, password reset |
| **Required** | Yes (for account creation) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until account deletion |
| **Encrypted** | Yes (in transit and at rest) |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None (not shared) |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes (in account export) |

### 2.2 Display Name

| Attribute | Details |
|---|---|
| **What** | Your chosen display name |
| **Why** | Personalization in the app |
| **Required** | Yes (for account creation) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until account deletion |
| **Encrypted** | Yes (in transit and at rest) |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None (not shared) |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes (in account export) |

### 2.3 Password Hash

| Attribute | Details |
|---|---|
| **What** | Hashed version of your password |
| **Why** | Account security |
| **Required** | Yes (for account creation) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until account deletion |
| **Encrypted** | Yes (bcrypt hashing) |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None (not shared) |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | No (security measure) |

### 2.4 Profile Picture (Optional)

| Attribute | Details |
|---|---|
| **What** | Optional profile picture |
| **Why** | Personalization |
| **Required** | No |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes |
| **Storage** | Local device only (not synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 3. Authentication Data

### 3.1 Login Timestamps

| Attribute | Details |
|---|---|
| **What** | Date and time of each login |
| **Why** | Security monitoring, suspicious activity detection |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (security) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes |

### 3.2 Session Tokens

| Attribute | Details |
|---|---|
| **What** | JWT authentication tokens |
| **Why** | Maintain login session |
| **Required** | Yes (for authenticated sessions) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | 30 days |
| **Encrypted** | Yes |
| **Storage** | Your device (localStorage) |
| **Third Parties** | None |
| **Deletable** | Yes (on logout) |
| **Exportable** | N/A |

### 3.3 Device Information

| Attribute | Details |
|---|---|
| **What** | Device model, OS, browser type |
| **Why** | Session management, compatibility |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (security) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes |

### 3.4 IP Address (Authentication)

| Attribute | Details |
|---|---|
| **What** | IP address used for authentication |
| **Why** | Security, fraud prevention |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (security) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes |

### 3.5 Google OAuth ID

| Attribute | Details |
|---|---|
| **What** | Google account identifier |
| **Why** | Google Sign-in authentication |
| **Required** | Yes (if using Google Sign-in) |
| **Legal Basis** | Consent |
| **Retention** | Until account deletion |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | Google (for authentication only) |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes |

---

## 4. Device Data

### 4.1 Device Model

| Attribute | Details |
|---|---|
| **What** | Device manufacturer and model |
| **Why** | Compatibility, debugging |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (service improvement) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | Vercel logs (temporary) |
| **Third Parties** | None |
| **Deletable** | N/A (not linked to account) |
| **Exportable** | N/A |

### 4.2 Operating System

| Attribute | Details |
|---|---|
| **What** | OS name and version |
| **Why** | Compatibility, debugging |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (service improvement) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | Vercel logs (temporary) |
| **Third Parties** | None |
| **Deletable** | N/A (not linked to account) |
| **Exportable** | N/A |

### 4.3 Browser Type

| Attribute | Details |
|---|---|
| **What** | Browser name and version |
| **Why** | Compatibility, debugging |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (service improvement) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | Vercel logs (temporary) |
| **Third Parties** | None |
| **Deletable** | N/A (not linked to account) |
| **Exportable** | N/A |

### 4.4 App Version

| Attribute | Details |
|---|---|
| **What** | BelieversFlow version number |
| **Why** | Compatibility, update management |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (service improvement) |
| **Retention** | 90 days |
| **Encrypted** | Yes |
| **Storage** | Vercel logs (temporary) |
| **Third Parties** | None |
| **Deletable** | N/A (not linked to account) |
| **Exportable** | N/A |

---

## 5. Application Data

### 5.1 Tasks

| Attribute | Details |
|---|---|
| **What** | Task text, category, time, completion status |
| **Why** | Core task management functionality |
| **Required** | Yes (for task feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes (individual tasks or all) |
| **Exportable** | Yes (JSON export) |

### 5.2 Prayer Logs

| Attribute | Details |
|---|---|
| **What** | Prayer date, duration, notes |
| **Why** | Prayer tracking, streak calculation |
| **Required** | Yes (for prayer feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes (JSON export) |

### 5.3 Diary Entries

| Attribute | Details |
|---|---|
| **What** | Entry title, content, mood, date |
| **Why** | Personal journaling |
| **Required** | Yes (for diary feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes (JSON export) |

### 5.4 App Settings

| Attribute | Details |
|---|---|
| **What** | Theme, font size, display mode, language |
| **Why** | Personalization |
| **Required** | Yes (for settings feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes (factory reset) |
| **Exportable** | Yes (JSON export) |

### 5.5 Navigation Order

| Attribute | Details |
|---|---|
| **What** | Custom tab order |
| **Why** | Personalization |
| **Required** | Yes (for customizable nav) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 6. Usage Data

### 6.1 Bible Reading History

| Attribute | Details |
|---|---|
| **What** | Books, chapters, and timestamps read |
| **Why** | Recent reads, reading progress |
| **Required** | Yes (for recent reads feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 6.2 Hymn Favorites

| Attribute | Details |
|---|---|
| **What** | Favorited hymn IDs |
| **Why** | Quick access to favorites |
| **Required** | Yes (for favorites feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 6.3 Recently Played Hymns

| Attribute | Details |
|---|---|
| **What** | List of recently played hymns |
| **Why** | Quick access |
| **Required** | Yes (for recent plays feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Local only |
| **Storage** | Local device only |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 6.4 Chat History

| Attribute | Details |
|---|---|
| **What** | AI conversation messages |
| **Why** | Conversation context, history |
| **Required** | Yes (for chat feature) |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user |
| **Encrypted** | Local only |
| **Storage** | Local device only (not synced) |
| **Third Parties** | None (AI providers process but don't store) |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 7. AI Interaction Data

### 7.1 Chat Messages

| Attribute | Details |
|---|---|
| **What** | Messages sent to AI and AI responses |
| **Why** | Provide AI-powered assistance |
| **Required** | Yes (for AI feature) |
| **Legal Basis** | Consent |
| **Retention** | Processed in real-time, not stored permanently |
| **Encrypted** | Yes (in transit) |
| **Storage** | Temporary cache (deleted after response) |
| **Third Parties** | GROQ, OpenAI, OpenRouter (process only, don't store) |
| **Deletable** | Yes (clear chat history) |
| **Exportable** | Yes (before deletion) |

### 7.2 AI Search Queries

| Attribute | Details |
|---|---|
| **What** | Bible verse search queries |
| **Why** | Provide relevant search results |
| **Required** | Yes (for AI search) |
| **Legal Basis** | Consent |
| **Retention** | Not stored permanently |
| **Encrypted** | Yes (in transit) |
| **Storage** | Not stored |
| **Third Parties** | Pinecone (for vector search) |
| **Deletable** | N/A (not stored) |
| **Exportable** | N/A |

### 7.3 AI Feedback (Optional)

| Attribute | Details |
|---|---|
| **What** | User feedback on AI responses |
| **Why** | Service improvement |
| **Required** | No (optional) |
| **Legal Basis** | Consent |
| **Retention** | 12 months (anonymized) |
| **Encrypted** | Yes |
| **Storage** | Anonymized aggregate |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 8. Bible Study Data

### 8.1 Bible Version Preference

| Attribute | Details |
|---|---|
| **What** | Selected Bible translation |
| **Why** | Display preferred translation |
| **Required** | Yes (for Bible feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until changed or account deletion |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 8.2 Bible Text Cache

| Attribute | Details |
|---|---|
| **What** | Cached Bible chapter text |
| **Why** | Offline reading, performance |
| **Required** | Yes (for caching) |
| **Legal Basis** | Legitimate interest (performance) |
| **Retention** | Until cache cleared or account deletion |
| **Encrypted** | Local only |
| **Storage** | Local device only |
| **Third Parties** | None |
| **Deletable** | Yes (clear cache) |
| **Exportable** | Yes |

---

## 9. Devotional Data

### 9.1 Reading Progress

| Attribute | Details |
|---|---|
| **What** | Which devotionals have been read |
| **Why** | Progress tracking |
| **Required** | Yes (for progress feature) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Local only |
| **Storage** | Local device only |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 10. Music/Hymn Data

### 10.1 Hymn Favorites

| Attribute | Details |
|---|---|
| **What** | Favorited hymn IDs |
| **Why** | Quick access |
| **Required** | Yes (for favorites) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes (if synced) |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 10.2 Listening History

| Attribute | Details |
|---|---|
| **What** | Recently played hymns |
| **Why** | Quick access |
| **Required** | Yes (for recent plays) |
| **Legal Basis** | Contract (providing the service) |
| **Retention** | Until deleted by user |
| **Encrypted** | Local only |
| **Storage** | Local device only |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 11. Community Data

### 11.1 Posts and Replies

| Attribute | Details |
|---|---|
| **What** | Community posts and replies |
| **Why** | Community interaction |
| **Required** | Yes (for community features) |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes (in transit and at rest) |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 11.2 Prayer Requests

| Attribute | Details |
|---|---|
| **What** | Shared prayer requests |
| **Why** | Community prayer support |
| **Required** | Yes (for prayer sharing) |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 11.3 Likes/Reactions

| Attribute | Details |
|---|---|
| **What** | Likes on posts |
| **Why** | Engagement tracking |
| **Required** | Yes (for likes feature) |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

### 11.4 Reports

| Attribute | Details |
|---|---|
| **What** | User reports of violations |
| **Why** | Moderation, safety |
| **Required** | Yes (for reporting) |
| **Legal Basis** | Legitimate interest (safety) |
| **Retention** | Indefinite (for safety) |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | No (for safety) |
| **Exportable** | No |

### 11.5 Moderation Actions

| Attribute | Details |
|---|---|
| **What** | Moderation actions taken |
| **Why** | Safety, accountability |
| **Required** | Yes (automatic) |
| **Legal Basis** | Legitimate interest (safety) |
| **Retention** | Indefinite |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | None |
| **Deletable** | No |
| **Exportable** | No |

---

## 12. Payment Data

### 12.1 Subscription Status

| Attribute | Details |
|---|---|
| **What** | Current subscription tier |
| **Why** | Feature access |
| **Required** | Yes (for subscriptions) |
| **Legal Basis** | Contract |
| **Retention** | Until cancelled |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | Flutterwave/Paystack |
| **Deletable** | Yes (with account deletion) |
| **Exportable** | Yes |

### 12.2 Payment Provider Tokens

| Attribute | Details |
|---|---|
| **What** | Payment method tokens |
| **Why** | Payment processing |
| **Required** | Yes (for subscriptions) |
| **Legal Basis** | Contract |
| **Retention** | Handled by payment provider |
| **Encrypted** | Yes |
| **Storage** | Flutterwave/Paystack (not our servers) |
| **Third Parties** | Flutterwave/Paystack |
| **Deletable** | Yes (cancel subscription) |
| **Exportable** | No (security) |

### 12.3 Transaction History

| Attribute | Details |
|---|---|
| **What** | Payment transaction records |
| **Why** | Billing, legal compliance |
| **Required** | Yes (legal requirement) |
| **Legal Basis** | Legal obligation |
| **Retention** | 7 years (tax/legal requirement) |
| **Encrypted** | Yes |
| **Storage** | PostgreSQL (Aiven) |
| **Third Parties** | Flutterwave/Paystack |
| **Deletable** | No (legal requirement) |
| **Exportable** | Yes |

---

## 13. Notification Data

### 13.1 Push Notification Tokens

| Attribute | Details |
|---|---|
| **What** | Device push notification token |
| **Why** | Deliver notifications |
| **Required** | Yes (for push notifications) |
| **Legal Basis** | Consent |
| **Retention** | Until notifications disabled |
| **Encrypted** | Yes |
| **Storage** | Vercel/serverless |
| **Third Parties** | FCM (Google), APNs (Apple) |
| **Deletable** | Yes (disable notifications) |
| **Exportable** | N/A |

### 13.2 Notification Preferences

| Attribute | Details |
|---|---|
| **What** | Notification settings |
| **Why** | Customize notifications |
| **Required** | Yes (for notifications) |
| **Legal Basis** | Consent |
| **Retention** | Until account deletion |
| **Encrypted** | Yes |
| **Storage** | Local device (default), PostgreSQL (if synced) |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 14. Location Data

### 14.1 Approximate Location (Future)

| Attribute | Details |
|---|---|
| **What** | City/region level location |
| **Why** | Church finder (future feature) |
| **Required** | No (only when enabled) |
| **Legal Basis** | Consent |
| **Retention** | Until disabled |
| **Encrypted** | Yes |
| **Storage** | Local device only |
| **Third Parties** | None |
| **Deletable** | Yes (disable location) |
| **Exportable** | Yes |

### 14.2 Precise Location

| Attribute | Details |
|---|---|
| **What** | GPS coordinates |
| **Why** | Never collected |
| **Required** | N/A |
| **Legal Basis** | N/A |
| **Retention** | N/A |
| **Encrypted** | N/A |
| **Storage** | N/A |
| **Third Parties** | N/A |
| **Deletable** | N/A |
| **Exportable** | N/A |

---

## 15. Media Data

### 15.1 Uploaded Images (Future)

| Attribute | Details |
|---|---|
| **What** | User-uploaded images |
| **Why** | Profile pictures, community posts |
| **Required** | No (optional) |
| **Legal Basis** | Consent |
| **Retention** | Until deleted by user |
| **Encrypted** | Yes |
| **Storage** | Vercel/serverless |
| **Third Parties** | None |
| **Deletable** | Yes |
| **Exportable** | Yes |

---

## 16. Third-Party Data Sharing

### 16.1 Service Providers

| Provider | Data Shared | Purpose | Region |
|---|---|---|---|
| **Vercel** | App files, API requests | Hosting | Global |
| **Aiven** | User data (if synced) | Database | EU/Global |
| **Pinecone** | Bible embeddings | Vector search | Global |
| **GROQ** | Chat messages (temp) | AI inference | USA |
| **OpenAI** | Chat messages, text | AI inference, embeddings | USA |
| **OpenRouter** | Chat messages (temp) | AI inference | Global |
| **Google** | OAuth ID token | Authentication | Global |
| **Flutterwave** | Payment tokens | Payment processing | Africa/Global |

### 16.2 No Data Selling

**We never sell your personal data to third parties.**

### 16.3 No Advertising

**We do not use advertising trackers or share data with advertisers.**

---

## 17. Data Retention Summary

| Data Category | Retention Period | Deletable |
|---|---|---|
| Account data | Until account deletion | Yes |
| App data (local) | Until deleted by user | Yes |
| App data (synced) | Until account deletion | Yes |
| Authentication data | 90 days | Yes |
| AI chat messages | Not stored permanently | N/A |
| Bible reading history | Until deleted by user | Yes |
| Devotional progress | Until deleted by user | Yes |
| Hymn favorites | Until deleted by user | Yes |
| Community posts | Until deleted by user | Yes |
| Prayer requests | Until deleted by user | Yes |
| Reports | Indefinite | No |
| Moderation actions | Indefinite | No |
| Transaction history | 7 years | No (legal) |
| Crash logs | 90 days | N/A |

---

## 18. Your Rights

### 18.1 Access Your Data

You can access your data through:
- Privacy Dashboard (in-app)
- Settings > Backup > Export Data

### 18.2 Delete Your Data

You can delete your data through:
- Individual item deletion (tasks, diary, etc.)
- Settings > Backup > Factory Reset
- Settings > Profile > Delete Account

### 18.3 Export Your Data

You can export your data through:
- Settings > Backup > Export Data
- Format: JSON

### 18.4 Contact Us

For any data-related requests:
**Email:** privacy@believersflow.app
**GitHub:** github.com/ecoinboxhub/believers_flow/issues

---

**Document Version:** 1.0.0
**Effective Date:** July 4, 2026
**Last Updated:** July 4, 2026

> **LEGAL DISCLAIMER:** This Data Collection Disclosure is a template and should be reviewed by qualified legal counsel before public release. The author assumes no liability for legal consequences arising from the use of this template without proper legal review.
