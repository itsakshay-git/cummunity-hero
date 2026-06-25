# Firestore Schema Documentation

This document defines the Firestore collection schemas and fields used by the Community Hero application to support social features, gamification, and issue tracking.

---

## 1. `users` Collection
* **Path**: `users/{userId}`
* **Description**: User profile data, statistics, levels, and badges.

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Unique user identifier (matches auth UID). |
| `displayName` | string | Full name of the user. |
| `username` | string | Unique user handle (e.g. `@johndoe`). |
| `email` | string | Registered email address. |
| `photoURL` | string | Link to profile avatar image. |
| `coverImageUrl` | string | Link to profile cover/banner image. |
| `bio` | string | User-provided bio statement. |
| `location` | string | User's residential neighborhood/city. |
| `role` | string | `Citizen` \| `Community Admin` \| `Resolver` \| `Authority`. |
| `xp` | number | Accumulated Experience Points. |
| `level` | number | Calculated level based on XP thresholds. |
| `trustScore` | number | Public credibility score (0 - 100). |
| `reputationScore`| number | Legacy XP mapping. |
| `currentStreak` | number | Daily login/contribution streak in days. |
| `longestStreak` | number | Peak streak recorded. |
| `totalReports` | number | Total issues submitted. |
| `totalVerifications`| number | Total neighborhood reports verified. |
| `totalSupports` | number | Total issues supported/liked. |
| `totalComments` | number | Total comments posted. |
| `totalCommunities`| number | Number of joined community hubs. |
| `badges` | array[string] | List of badge IDs earned. |
| `createdAt` | string (ISO) | Document creation timestamp. |
| `updatedAt` | string (ISO) | Last modification timestamp. |

---

## 2. `communities` Collection
* **Path**: `communities/{communityId}`
* **Description**: Hyperlocal residential areas, spaces, or wards.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Community name (e.g. "Green Park Society"). |
| `slug` | string | URL-friendly name. |
| `type` | string | `Apartment` \| `Housing Society` \| `Street` \| `Ward` \| `Village` \| `Campus` \| `Market` \| `Other`. |
| `description` | string | Context description of the community space. |
| `coverImageUrl` | string | Community banner picture. |
| `logoUrl` | string | Community profile emblem. |
| `areaName` | string | Neighborhood region / town. |
| `latitude` | number | Center geographic latitude. |
| `longitude` | number | Center geographic longitude. |
| `createdBy` | string | User ID of the creator. |
| `adminIds` | array[string] | User IDs of the community managers. |
| `memberCount` | number | Size of community membership. |
| `healthScore` | number | General civic condition score (0 - 100). |
| `reputationScore`| number | Total collective reputation score. |
| `level` | number | Level tier of the community. |
| `totalIssues` | number | Count of all issues reported. |
| `resolvedIssues` | number | Count of resolved incidents. |
| `activeIssues` | number | Count of unresolved incidents. |

---

## 3. `community_members` Collection
* **Path**: `community_members/{memberId}`
* **Description**: Maps user membership and roles inside communities.

| Field | Type | Description |
| :--- | :--- | :--- |
| `communityId` | string | Target community ID. |
| `userId` | string | User ID. |
| `role` | string | `MEMBER` \| `ADMIN` \| `RESOLVER` \| `AUTHORITY`. |
| `status` | string | `PENDING` \| `APPROVED` \| `BLOCKED`. |
| `contributionScore`| number | Member's score inside this specific community. |
| `joinedAt` | string (ISO) | Date joined. |

---

## 4. `issues` Collection
* **Path**: `issues/{issueId}`
* **Description**: Reported infrastructure and maintenance issues.

| Field | Type | Description |
| :--- | :--- | :--- |
| `communityId` | string | Parent community ID. |
| `reportedBy` | string | Submitter's user ID. |
| `title` | string | Short issue title. |
| `description` | string | Detailed explanation. |
| `category` | string | Pothole, Garbage, Water Leakage, etc. |
| `severity` | string | Low, Medium, High, Critical. |
| `status` | string | OPEN, AI_ANALYZED, COMMUNITY_VERIFIED, etc. |
| `latitude` | number | GPS Latitude. |
| `longitude` | number | GPS Longitude. |
| `address` | string | Text location address. |
| `imageUrl` | string | Path to uploaded image snapshot. |
| `videoUrl` | string | Path to uploaded video (optional). |
| `aiSummary` | string | Professional Gemini AI scan digest. |
| `aiConfidence` | number | Confidence rating (0.0 to 1.0). |
| `riskLevel` | string | Evaluated hazard risk level. |
| `suggestedDepartment`| string | Recommended department for assignment. |
| `priorityScore` | number | Priority value (0 to 100). |
| `trustScore` | number | Calculated reliability score based on confirmations. |
| `supportCount` | number | Number of supports/likes. |
| `commentCount` | number | Number of comment replies. |
| `verificationCount` | number | Affirmative neighbor confirmations. |
| `fakeCount` | number | Incident flagged as fraudulent/fake. |
| `shareCount` | number | Share click counters. |
| `saveCount` | number | Bookmark save counters. |
| `duplicateOfIssueId`| string \| null| Master issue ID if duplicate. |
| `assignedTo` | string | Resolver user ID. |
| `createdAt` | string (ISO) | Timestamp of report. |
| `updatedAt` | string (ISO) | Timestamp of last modification. |
| `resolvedAt` | string (ISO) | Timestamp of resolution (optional). |

---

## 5. `feed_posts` Collection
* **Path**: `feed_posts/{postId}`
* **Description**: Central timeline feed abstractions (issue posts, community updates).

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | string | `ISSUE_REPORTED` \| `ISSUE_RESOLVED` \| `COMMUNITY_UPDATE` \| `BADGE_EARNED` \| `CHALLENGE_UPDATE`. |
| `issueId` | string | Optional reference to direct issue. |
| `communityId` | string | Community scope ID. |
| `userId` | string | Actor user ID. |
| `title` | string | Post title card. |
| `body` | string | Post body content. |
| `imageUrl` | string | Image attachment (optional). |
| `status` | string | Linked issue status. |
| `category` | string | Linked issue category. |
| `severity` | string | Linked issue severity. |
| `visibility` | string | `PUBLIC` \| `COMMUNITY` \| `PRIVATE`. |
| `supportCount` | number | React count. |
| `commentCount` | number | Comments count. |
| `shareCount` | number | Share count. |
| `saveCount` | number | Bookmark count. |

---

## 6. `comments` Collection
* **Path**: `comments/{commentId}`
* **Description**: User discussions on issues/posts.

| Field | Type | Description |
| :--- | :--- | :--- |
| `postId` | string | Reference to parent feed post (optional). |
| `issueId` | string | Reference to direct issue ID. |
| `communityId` | string | Community scope ID. |
| `userId` | string | Commenter user ID. |
| `parentCommentId`| string \| null| Thread replies nesting support. |
| `body` | string | Text comment body. |
| `likeCount` | number | Likes count. |

---

## 7. `user_activity` Collection
* **Path**: `user_activity/{activityId}`
* **Description**: Timeline of action records for social logs.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | string | Actor user ID. |
| `type` | string | `REPORT_CREATED` \| `POST_SUPPORTED` \| `COMMENT_CREATED` \| `COMMUNITY_JOINED` \| `ISSUE_VERIFIED` \| `BADGE_EARNED` \| `ISSUE_RESOLVED`. |
| `targetId` | string | Reference to target document. |
| `targetType` | string | `ISSUE` \| `POST` \| `COMMUNITY` \| `COMMENT` \| `BADGE`. |
| `communityId` | string | Associated community scope. |
| `metadata` | map | Contextual details (e.g. badge name, score earned). |
