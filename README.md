# LinkedInTools

[LinkedInTools](https://linkedintools.github.io/) is an advanced browser extension designed to automate LinkedIn networking, streamline connection management, and provide enterprise-grade multi-tier account security.

## Core Automations

### 1. Connection Request Automation (Auto Connect)
- Sends personalized connection requests to targeted professionals with customized note placeholders and humanized pacing.
- Enforces safe daily quotas and strict throttle pacing to maintain full compliance and account safety.
- Automatically tracks sent connection requests and prevents sending duplicate invitations across campaigns.

### 2. New Connections Post Like
- Automatically likes recent posts of newly added connections to boost early engagement, warm up relationships, and maximize profile visibility.
- Configurable likes per profile (1-5 posts), connection recency timeframes, and customizable daily safety limits.
- Supports scheduled background execution (Manual, Daily, Weekly, Monthly) with randomized delays.

### 3. Inbound Connection Automation (Auto Inbound)
- Automates incoming invitation management by systematically accepting or ignoring pending connection requests.
- Batch-processes received invitations across people, pages, events, and newsletters with one-click bulk accept or ignore actions.
- Generates transparent real-time session logs, HTML report files, and comprehensive historical records.

### 4. Withdraw Automation (Auto Withdraw)
- Automatically cancels unanswered pending sent invitations that have not been accepted within your specified threshold (older than 14-365 days).
- Reclaims your pending invitation limits to ensure continuous and uninterrupted networking capabilities.
- Supports flexible scheduling, run limits, HTML export reports, and community repost unlocking.

### 5. Unfollow Automation (Auto Unfollow)
- Performs bulk unfollowing of connections or followed members to clean up your feed while keeping your 1st-degree connections intact.
- Eliminates feed clutter from inactive profiles or low-relevance content creators without losing direct messaging access.
- Provides batch processing with intelligent rate limiting, safety pauses, and real-time execution statistics.

### 6. Network Catch-Up Automation
- Automatically celebrates and interacts with network updates and career milestones on LinkedIn Catch-Up.
- Supports 4 distinct milestone categories: Job Changes, Work Anniversaries, Birthdays, and Education Achievements.
- Flexible run limits, customizable execution frequency, and real-time celebratory session metrics.

## Security Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              🛡️ LINKEDINTOOLS SECURITY ARCHITECTURE                             │
└─────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                  │      
┌─────────────────────────────────────────────────┴───────────────────────────────────────────────┐
│                    🛡️ 3-TIER ACTIVE DEFENSE CHAIN (WORKS AS A UNIFIED SYSTEM)                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │  1. EXTENSION PANEL PROT.   │ │ 2. LINKEDIN PAGE VIEW PROT. │ │ 3. EXTENSION REMOVAL PROT.  │ │
│ ├─────────────────────────────┤ ├─────────────────────────────┤ ├─────────────────────────────┤ │
│ │ • Restricts access to all   │ │ • When enabled, a password  │ │ • If unauthorized users     │ │
│ │   automation tools within   │ │   screen is automatically   │ │   attempt to bypass first   │ │
│ │   the extension exclusively │ │   displayed whenever        │ │   two security measures by  │ │
│ │   to you.                   │ │   LinkedIn is accessed.     │ │   removing the extension,   │ │
│ │                             │ │                             │ │   real-time alerts are      │ │
│ │ • Prevents unauthorized     │ │ • Ensures only authorized   │ │   sent to your phone        │ │
│ │   users from disabling      │ │   users who enter password  │ │   (mobile notifications),   │ │
│ │   protection settings       │ │   can browse your account.  │ │   allowing you to take      │ │
│ │   (LinkedIn Page View       │ │                             │ │   immediate action.         │ │
│ │   Protection).              │ │ • There is also an option   │ │                             │ │
│ │                             │ │   to redirect unauthorized  │ │                             │ │  
│ │                             │ │   users to a fake page.     │ │                             │ │  
│ └─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘ │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │         
                                                 ▼        
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                4. EXTENSION SECURITY LOGS                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • Failed password attempts, successful logins, page-level authentication entries, protection    │
│   toggle events, extension uninstallation events, and notification alerts are recorded with     │
│   timestamp and IP both in the panel and online, allowing authorized users to investigate       │ 
│   security issues.                                                                              │ 
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```
