# AGENT.md — Community Hero Development Rules

## Main Instruction

Do not rebuild the app from scratch.

Continue from the existing working application.

Before making changes:

1. Read the existing files.
2. Understand current components, services, hooks, and data structure.
3. Reuse existing methods where possible.
4. Only create new methods when existing ones cannot support the feature.
5. Do not duplicate logic.
6. Do not rename files unless necessary.
7. Do not change working features without reason.

---

## Product Direction

Community Hero should feel like a **social civic platform**, not an admin dashboard.

Design inspiration:

* Facebook feed
* Reddit posts
* LinkedIn profile
* Discord communities
* Mobile app bottom navigation

Avoid:

* Admin panel look
* Too many tables
* Dashboard-first layout
* Government portal style

---

## Current Goal

Improve the application in these areas:

1. User profile section
2. Social feed experience
3. Likes/supports/comments
4. User activity history
5. Community membership display
6. Gamification
7. Cleaner project structure

---

## UI Rules

### Desktop

Use a social media layout:

```text
Left Sidebar | Main Feed/Profile Content | Right Sidebar
```

Left sidebar:

* Home
* Communities
* Map
* Report
* Challenges
* Leaderboard
* Profile

Right sidebar:

* Trending communities
* Top civic heroes
* Active challenges
* AI insights

### Mobile

Use bottom navigation:

```text
Home | Map | Report | Communities | Profile
```

Mobile must feel like a real mobile app.

---

## Profile Page Requirements

Add or improve profile page.

Profile should show:

* Profile photo
* Cover image
* Name
* Username
* Bio
* Location
* XP
* Level
* Trust score
* Badges
* Joined communities
* Reports created
* Issues supported
* Comments made
* Activity history

Profile tabs:

```text
Activity
Reports
Communities
Supported
Comments
Badges
```

---

## Feed Rules

The feed is the main experience.

Feed cards should show:

* User avatar
* User name
* Community name
* Time
* Issue image
* Issue title
* Description
* Location
* Severity
* Status
* Support count
* Comment count

Actions:

```text
Support
Comment
Share
Save
```

Every new issue should appear as a feed post.

---

## Firestore Schema Rule

Before changing Firestore:

1. Check existing collections and fields.
2. Reuse existing collections where possible.
3. Add only missing fields needed for social features.
4. Avoid creating duplicate collections for same purpose.

Required social fields to support:

For users:

```text
xp
level
trustScore
contributionScore
bio
coverImageUrl
totalReports
totalSupports
totalComments
badges
```

For issues/posts:

```text
supportCount
commentCount
shareCount
saveCount
```

For comments:

```text
postId or issueId
userId
body
createdAt
```

For user activity:

```text
userId
type
targetId
createdAt
metadata
```

---

## Project Structure Rules

Do not keep everything in one file.

Do not put all backend code in `server.js`.

Do not put Firebase or Gemini logic directly inside React components.

Use this pattern:

```text
Page → Component → Hook → Service → Firebase/API
```

For AI:

```text
UI → AI Service → Gemini API
```

If backend exists:

```text
UI → Backend Route → Gemini Service → Gemini API
```

---

## Folder Structure Rule

Do not force a full restructure at once.

Refactor gradually.

Preferred organization:

```text
src/
  components/
  pages/
  features/
  services/
  hooks/
  types/
  lib/
  styles/
```

Backend, if present:

```text
server/
  routes/
  controllers/
  services/
  middleware/
  utils/
```

---

## AI API Rules

Never call Gemini directly inside UI components.

Keep prompts in one place.

Keep Gemini logic in:

```text
src/services/ai/
```

or if backend exists:

```text
server/services/
```

Gemini should return structured JSON where possible.

Store AI results in Firestore so the app does not call Gemini repeatedly.

---

## Gamification Rules

Add simple gamification without overcomplicating.

Users earn XP for:

```text
Report issue
Support issue
Comment
Verify issue
Issue resolved
Daily activity
```

Add levels:

```text
Citizen
Reporter
Community Helper
Civic Hero
Community Champion
Guardian
```

Add badges:

```text
First Report
Top Verifier
Road Guardian
Water Warrior
Cleanliness Champion
Civic Hero
```

---

## Safety Rules

Before coding, always explain:

1. What files will be changed.
2. Why they will be changed.
3. What feature will be added.
4. What existing feature may be affected.

Do not modify more than one major feature at a time.

After each step, summarize:

1. What changed.
2. Which files changed.
3. How to test it.

---

## Immediate Next Task

Do only this first:

1. Review current profile/feed/community-related files.
2. Identify existing methods and schema.
3. Suggest minimal changes needed.
4. Do not write code yet.

Wait for approval before implementation.
