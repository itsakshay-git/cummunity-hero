# Phase 4: Communities Module Reference Guide

## 🏡 Module Overview
The **Communities Space** module allows citizens, community admins, resolvers, and municipal authorities to connect with local neighborhood zones. 

With the completion of Phase 4, the communities database is fully connected to Google Cloud Firestore, providing real-time data persistence, reactive updates, and automatic default seeding.

---

## ⚡ Key Features Added in Phase 4
1. **Firestore Data Backup**:
   - The app reads directly from the `communities` Firestore collection.
   - If the database is initially empty, the app **automatically seeds** default communities (`Green Park Society`, `Ward 12 Civic Forum`, `Pune Smart City Corridor`) ensuring a rich out-of-the-box user experience.
2. **Interactive Members & Join/Leave Flow**:
   - Joining a community space instantly saves the user to `memberIds` in the respective Firestore document and links the community ID to the user's personal profile document in the `users` collection.
   - Leaving is fully synced, removing pointers on both ends safely.
3. **Founder & Administrator Ownership**:
   - Creating a new community workspace uploads the entity to Firestore. The founder user is set as the creator and registered under `adminIds`, giving them special moderation privileges for tracking and assigning issues.
4. **Resilient Local Fallback**:
   - If Firebase connectivity is lost or custom security rules prevent full writes, the app gracefully falls back to local in-memory/simulation state. It provides warnings in the developer console instead of crashing, preserving extreme app stability.

---

## 💾 Schema Specifications (`communities` Collection)
Each document in the `communities` collection maintains:
- `id` (string): Unique identifier (prefaced with `comm_`).
- `name` (string): Distinct name of the civic space.
- `type` (string): Structural classification (e.g., *Housing Society*, *Ward*, *Market*, *Campus*).
- `description` (string): Detailed focus of the workspace.
- `areaName` (string): General locality (e.g., *Aundh, Pune*).
- `memberIds` (array of strings): List of contributing user UIDs.
- `adminIds` (array of strings): List of moderator user UIDs.
- `reputationScore` (number): Dynamic health rating of the space based on resolved issues.
- `totalIssues` (number): Cumulative reported issue count.
- `resolvedIssues` (number): Cumulative resolved issue count.
- `createdAt` / `updatedAt` (string): ISO Timestamps.
