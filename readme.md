# 🎨 Superboard

A modern, real-time collaborative whiteboard application built with **React 18** and **Firebase**.

🔗 **Live Demo:** [https://superboard-jet.vercel.app/](https://superboard-jet.vercel.app/)

📂 **Repository:** [https://github.com/SatvikHGupta/Superboard](https://github.com/SatvikHGupta/Superboard)

---

## Overview

Superboard is a full-featured collaborative whiteboard built as a personal portfolio project to demonstrate:

* Real-time system design
* Canvas rendering architecture
* State synchronization strategies
* Scalable Firebase integration
* Clean modular React architecture

The application supports multi-user collaboration with live cursor tracking, real-time updates, advanced drawing tools, and a structured admin panel.

---

## Core Features

### 🎨 Drawing & Creation

* 9 Professional Tools: Pen, Highlighter, Eraser, Line, Rectangle, Circle, Arrow, Text, Sticky Notes
* Adjustable colors, stroke widths, and font sizes
* Image paste support (auto-compressed to max 800px, JPEG 65%)
* Optional grid alignment
* Extendable canvas (default 1200×1600px)

---

### 🤝 Real-Time Collaboration

* Live cursor tracking (updates throttled at ~80ms)
* Instant multi-user sync using Firestore listeners
* Shareable public boards
* Editor-based access control
* View-only public mode (no login required)

---

### 💾 Smart Data Persistence

* Two-step save strategy:

  * Local cache for responsiveness
  * Firestore sync with ~600ms debounce
* Auto-generated board thumbnails (400×225px)
* Cross-device synchronization
* Last-write-wins conflict model

---

### ✏️ Editing System

* Select, move, resize elements
* Double-click to edit text & notes
* Undo / Redo (history stack)
* Clear board shortcut
* Keyboard tool switching

---

### 📤 Export

* High-resolution PNG export
* PDF export via jsPDF
* Direct download from viewer mode

---

### 🔐 Admin Panel

* Board management
* User analytics
* Activity monitoring
* Bulk operations

Admin panel access is role-restricted and enforced through Firestore security rules defined within the Firebase console.

---

## Architecture Highlights

This project demonstrates structured architectural decisions rather than basic CRUD implementation.

### 1️⃣ Context-Driven State Layer

Whiteboard state is centralized through a dedicated provider layer to prevent duplicate Firestore reads and ensure consistent synchronization.

### 2️⃣ Custom Hook Composition

Whiteboard logic is modularized into isolated hooks:

* Drawing
* History management
* Persistence
* Selection handling
* Eraser logic
* Drag management

This keeps the codebase maintainable and scalable.

### 3️⃣ Canvas Rendering Engine

* Dedicated render loop using `requestAnimationFrame`
* High-DPI rendering support
* Optimized hit-testing logic
* LRU-based image caching
* Isolated rendering utilities

### 4️⃣ Firestore Optimization Strategy

* Debounced writes (~600ms)
* Chunked batch updates
* Optimized cursor broadcasting (~80ms throttle)
* Real-time listeners for boards and elements

---

## Tech Stack

### Frontend

* React 18
* Vite
* Canvas API
* CSS Custom Properties (Design Tokens)

### Backend

* Firebase Authentication (Google OAuth)
* Cloud Firestore (Real-time Database)

### Utilities

* jsPDF
* html2canvas

### Deployment

* Vercel

---

## Local Development

### 1. Clone

```bash
git clone https://github.com/SatvikHGupta/Superboard.git
cd Superboard
```

### 2. Install

```bash
npm install
```

### 3. Firebase Setup (only if you want to actually make this application as per your rules and your api, cloning will not tell you my API keys, you will have to make yours and add additionally)

Create a Firebase project and enable:

* Google Authentication
* Firestore Database

Add your Firebase configuration inside:

```
src/firebase/config.js
```

Firestore security rules are defined within the Firebase console.

### 4. Run

```bash
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

## Production Build

```bash
npm run build
```

Deployment is configured for **Vercel**.

---

## What This Project Demonstrates

* Real-time collaborative system design
* Clean scalable React architecture
* Advanced canvas interaction handling
* Firebase performance optimization
* Modular hook-based state management
* Production-ready deployment workflow

---

## Purpose

Superboard was built to explore and implement:

* Collaborative whiteboard system mechanics
* Real-time synchronization challenges
* Canvas performance optimization
* Permission-based access control
* Structured frontend architecture at scale

This project focuses on engineering depth rather than surface-level features.

---

## License

Made as frontend project for portfolio but is now an Open-source project so that it gets better. Attribution appreciated if reused or extended.

---

## Closing Note

For developers: explore the hooks layer and Firestore synchronization logic.

For recruiters: this project reflects full-stack architectural thinking, real-time system handling, and scalable frontend design beyond standard CRUD applications.

---

**Built with precision using React and Firebase.**

***Made with love by SHG, check each file header for a unique comment about that specific file***
