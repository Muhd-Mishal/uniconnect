# UniConnect Level 1 Data Flow Diagrams

This document provides the Level 1 Data Flow Diagrams (DFDs) for both the **User (Student)** and **Admin** roles within the UniConnect platform.

---

## 1. Level 1 DFD: User (Student)

The Student DFD focuses on career development, social interaction, and real-time communication.

```mermaid
graph TD
    %% External Entities
    User((Student User))

    %% Processes
    P1[1.0 Auth & Verification]
    P2[2.0 Profile Management]
    P3[3.0 Social Interaction]
    P4[4.0 AI Interview Practice]
    P5[5.0 Real-time Messaging]
    P6[6.0 Resource Consumption]

    %% Data Stores
    D1[(Users Table)]
    D2[(Student Profiles)]
    D3[(Posts/Likes/Comments)]
    D4[(Interview Q&A)]
    D5[(Messages/Groups)]
    D6[(Career Resources)]

    %% Data Flows
    User -- "Credentials / OTP" --> P1
    P1 -- "Auth Token" --> User
    P1 <--> D1

    User -- "Profile Details / Resume" --> P2
    P2 -- "Profile Information" --> User
    P2 <--> D2

    User -- "Post Content / Likes / Comments" --> P3
    P3 -- "Personalized Feed" --> User
    P3 <--> D3

    User -- "Answers / Domain Choice" --> P4
    P4 -- "AI Feedback / Scores" --> User
    P4 <--> D4

    User -- "Chat Messages" --> P5
    P5 -- "Instant Notifications" --> User
    P5 <--> D5

    User -- "Search Query" --> P6
    P6 -- "Resource Links" --> User
    P6 <--> D6
```

---

## 2. Level 1 DFD: Admin

The Admin DFD focuses on system moderation, management of resources, and monitoring.

```mermaid
graph TD
    %% External Entities
    Admin((Administrator))

    %% Processes
    A1[1.0 User Administration]
    A2[2.0 Content Moderation]
    A3[3.0 Resource Management]
    A4[4.0 AI Content Mgmt]
    A5[5.0 System Analytics]

    %% Data Stores
    D1[(Users Table)]
    D2[(Posts Table)]
    D3[(Resources Table)]
    D4[(Interview Questions)]

    %% Data Flows
    Admin -- "Delete User Request" --> A1
    A1 -- "User List / Status" --> Admin
    A1 <--> D1

    Admin -- "Remove Post Request" --> A2
    A2 -- "Moderation Status" --> Admin
    A2 <--> D2

    Admin -- "New Resource Data" --> A3
    A3 -- "Creation Success" --> Admin
    A3 <--> D3

    Admin -- "Add Question / Delete" --> A4
    A4 -- "Question Bank list" --> Admin
    A4 <--> D4

    Admin -- "Stats Request" --> A5
    A5 -- "Usage Metrics / Reports" --> Admin
    A5 -.-> D1
    A5 -.-> D2
```

---

### Description of Components

#### For User (Student):
- **Auth & Verification**: Handles secure login, registration, and OTP-based email verification.
- **Profile Management**: Allows students to build their professional identity with skills and resumes.
- **AI Interview Practice**: Integration with Gemini AI to provide mock interviews and scoring.
- **Social Interaction**: The core networking aspect where users share career-related updates.

#### For Admin:
- **User Administration**: Capabilities to manage user accounts and handles reports.
- **Resource Management**: Curating external career links for students.
- **AI Content Mgmt**: Managing the pool of domain-specific questions used by the AI engine.
- **System Analytics**: Providing a high-level overview of platform engagement.
