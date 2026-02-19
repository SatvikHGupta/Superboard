# 🎨 Superboard

> A modern, real-time collaborative whiteboard application built with React and Firebase

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://superboard.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61dafb.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange.svg)](https://firebase.google.com/)

---

## 🌟 Features

### 🎨 Drawing & Creation
- **9 Professional Tools**: Pen, Highlighter, Eraser, Line, Rectangle, Circle, Arrow, Text, Sticky Notes
- **Rich Customization**: Adjustable colors, stroke widths, and font sizes
- **Image Support**: Paste images directly from clipboard with automatic compression (max 800px, JPEG 65%)
- **Grid Toggle**: Optional alignment grid for precise drawing
- **Infinite Canvas**: Extendable board size (default 1200×1600px)

### 🤝 Collaboration
- **Real-time Cursors**: See other users' cursors with names in real-time
- **Live Updates**: All changes sync instantly across all connected users
- **Share Controls**: Add editors or make boards public with shareable links
- **View-Only Mode**: Public boards can be viewed without login

### 💾 Data & Storage
- **Auto-save**: 2-step save strategy (localStorage + Firestore with 600ms debounce)
- **Save Indicators**: Visual feedback (saving/saved/error states)
- **Thumbnails**: Auto-generated board previews (400×225px JPEG)
- **Cross-device Sync**: Access your boards from any device

### ✏️ Editing Features
- **Select & Move**: Drag and reposition elements
- **Resize**: Interactive resize handles for shapes and notes
- **Double-click Edit**: Re-edit text and sticky notes after creation
- **Undo/Redo**: Full history navigation (Ctrl+Z / Ctrl+Y)
- **Clear All**: Quick board reset (Shift+X)

### 📤 Export Options
- **PNG Export**: High-quality raster image export
- **PDF Export**: Vector-based PDF generation
- **Download**: Direct file downloads from viewer

### 🔐 Admin Panel
- **Overview Dashboard**: Real-time statistics and activity monitoring
- **Board Management**: View, edit, delete, and bulk operations
- **User Analytics**: Track active users and board ownership
- **Search & Filter**: Find boards by name, owner, or visibility
- **Grid/List Views**: Toggle between visual layouts
- **Bulk Actions**: Select multiple boards for batch operations

### 📱 Mobile Support
- **Responsive Design**: Optimized for tablets and phones
- **Touch Controls**: Native touch drawing support
- **Bottom Toolbar**: Mobile-optimized tool placement
- **Gesture Support**: Pinch, zoom, and pan (coming soon)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CSS Custom Properties** - Design system and theming
- **Canvas API** - Drawing engine

### Backend & Services
- **Firebase Authentication** - Google OAuth sign-in
- **Cloud Firestore** - Real-time database
- **Firebase Hosting** - Static file hosting (optional)

### Utilities
- **jsPDF** - PDF generation
- **html2canvas** - Canvas export

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account ([console.firebase.google.com](https://console.firebase.google.com))
- Git

### 1. Clone Repository
```bashgit clone https://github.com/yourusername/superboard.git
cd superboard

### 2. Install Dependencies
```bashnpm install

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enable Google Analytics (optional)

#### Enable Authentication
1. In Firebase Console → Authentication → Sign-in method
2. Enable "Google" provider
3. Add your domain to authorized domains

#### Create Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select a location (e.g., `us-central1`)

#### Set up Security Rules
In Firestore → Rules tab, paste:
```javascriptrules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {function isAuthenticated() {
  return request.auth != null;
}function isOwner(boardId) {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/boards/$(boardId)).data.ownerId == request.auth.uid;
}function isEditor(boardId) {
  return isAuthenticated() && 
         request.auth.token.email in get(/databases/$(database)/documents/boards/$(boardId)).data.editors;
}function isPublic(boardId) {
  return get(/databases/$(database)/documents/boards/$(boardId)).data.visibility == 'public';
}function isAdmin() {
  return isAuthenticated() && 
         request.auth.token.email in [
           "your-admin-email@gmail.com"
         ];
}match /boards/{boardId} {
  allow read: if isOwner(boardId) || isEditor(boardId) || isPublic(boardId);
  allow create: if isAuthenticated();
  allow update: if isOwner(boardId) || isEditor(boardId);
  allow delete: if isOwner(boardId);  match /elements/{elementId} {
    allow read: if isOwner(boardId) || isEditor(boardId) || isPublic(boardId);
    allow write: if isOwner(boardId) || isEditor(boardId);
  }  match /cursors/{userId} {
    allow read: if isOwner(boardId) || isEditor(boardId);
    allow write: if isOwner(boardId) || isEditor(boardId);
  }
}
}
}

#### Get Firebase Config
1. Project Settings → General → Your apps → Web app
2. Copy the config object

### 4. Configure Environment

Create `src/firebase/config.js`:
```javascriptimport { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';const firebaseConfig = {
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
projectId: "YOUR_PROJECT_ID",
storageBucket: "YOUR_PROJECT_ID.appspot.com",
messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
appId: "YOUR_APP_ID"
};const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

### 5. Set Admin Emails

Update admin emails in two files:

**`src/components/admin/AdminPage.jsx`** (line 6):
```javascriptconst ADMIN_EMAILS = ['your-email@gmail.com'];

**`src/components/dashboard/Dashboard.jsx`** (line 9):
```javascriptconst ADMIN_EMAILS = ['your-email@gmail.com'];

### 6. Add Favicon

Place your `icon.png` file in: `public/icon.png`

### 7. Run Development Server
```bashnpm run dev

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Build & Deploy

### Build for Production
```bashnpm run build

Output: `dist/` directory

### Deploy to Vercel
```bashInstall Vercel CLI
npm i -g vercelDeploy
vercelProduction deployment
vercel --prod

### Deploy to Firebase Hosting
```bashInstall Firebase CLI
npm i -g firebase-toolsLogin
firebase loginInitialize
firebase init hostingDeploy
firebase deploy --only hosting

---

## 🎯 Usage Guide

### Creating Your First Board
1. Sign in with Google
2. Enter a board name in the input field
3. Click "Create"
4. Start drawing!

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Shift + P` | Pen tool |
| `Shift + H` | Highlighter |
| `Shift + E` | Eraser |
| `Shift + L` | Line |
| `Shift + R` | Rectangle |
| `Shift + C` | Circle |
| `Shift + A` | Arrow |
| `Shift + T` | Text |
| `Shift + N` | Note |
| `Shift + G` | Toggle grid |
| `Shift + X` | Clear all |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Delete/Backspace` | Delete selected |

### Sharing Boards
1. Click the share icon in the whiteboard header
2. Toggle "Public" to generate a shareable link
3. Or add editors by email address
4. Copy the link and share!

### Admin Access
1. Log in with an admin email
2. Click "Admin" button in dashboard header
3. Access at `/#/admin`

---

## 📁 Project Structuresuperboard/
├── public/
│   └── icon.png                    # Favicon
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminPage.jsx       # Admin panel
│   │   │   └── BoardDetailsModal.jsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── BoardCard.jsx       # Board preview card
│   │   │   └── CreateBoard.jsx     # Board creation form
│   │   ├── toolbar/
│   │   │   ├── Toolbar.jsx         # Drawing tools
│   │   │   ├── ColorPicker.jsx
│   │   │   └── StrokeControl.jsx
│   │   ├── whiteboard/
│   │   │   ├── Whiteboard.jsx      # Main whiteboard
│   │   │   ├── WhiteboardHeader.jsx
│   │   │   ├── ExportDropdown.jsx
│   │   │   └── ExtendButton.jsx
│   │   ├── Canvas.jsx              # Drawing canvas
│   │   ├── LoginPage.jsx           # Google auth
│   │   ├── ViewerPage.jsx          # Public viewer
│   │   ├── ShareModal.jsx          # Sharing controls
│   │   └── ShortcutsModal.jsx      # Keyboard help
│   ├── firebase/
│   │   ├── config.js               # Firebase setup
│   │   ├── auth.js                 # Authentication
│   │   ├── boardService.js         # Board CRUD
│   │   ├── elementService.js       # Drawing elements
│   │   └── cursorService.js        # Real-time cursors
│   ├── hooks/
│   │   ├── useWhiteboard.js        # Main whiteboard logic
│   │   └── useBoardPersistence.js  # Auto-save & sync
│   ├── utils/
│   │   ├── drawing/
│   │   │   ├── renderCanvas.js     # Canvas rendering
│   │   │   ├── drawElement.js      # Element drawing
│   │   │   ├── hitTest.js          # Click detection
│   │   │   ├── exportCanvas.js     # PNG/PDF export
│   │   │   └── ...
│   │   └── storage.js              # Legacy localStorage (deprecated)
│   ├── constants/
│   │   ├── tools.js                # Tool definitions
│   │   ├── colors.js               # Color palettes
│   │   ├── defaults.js             # Default values
│   │   └── shortcuts.js            # Keyboard shortcuts
│   ├── styles/
│   │   ├── index.css               # Main stylesheet
│   │   ├── variables.css           # Design tokens
│   │   ├── base.css                # Base & responsive
│   │   ├── admin.css               # Admin panel styles
│   │   └── ...
│   ├── App.jsx                     # Root component
│   └── main.jsx                    # Entry point
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── UPDATES.md

---

## 🔒 Security & Privacy

- **Authentication Required**: All boards require Google sign-in to create/edit
- **Owner Permissions**: Only board owners can delete or change sharing settings
- **Editor Access**: Editors can draw but not manage sharing
- **Public Viewing**: Public boards are read-only for non-editors
- **Admin Isolation**: Admin panel only accessible to configured emails
- **Firestore Rules**: Server-side security enforced at database level

---

## 🐛 Known Issues & Limitations

- **Offline Support**: Not currently available (requires online connection)
- **Mobile Drawing**: Limited precision on small screens
- **Browser Compatibility**: Optimized for Chrome/Edge/Safari (Firefox supported)
- **File Size**: Large boards (>5MB) may have slower load times
- **Concurrent Editing**: No operational transformation (last write wins)

---

## 🗺️ Roadmap

- [ ] Offline mode with service workers
- [ ] Voice/video chat integration
- [ ] More shapes (triangle, polygon, star)
- [ ] Layers system
- [ ] Presentation mode
- [ ] Templates library
- [ ] Export to SVG
- [ ] Mobile apps (React Native)
- [ ] API for integrations
- [ ] Version history viewer

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Test changes on multiple browsers
- Update documentation for new features
- Keep commits atomic and well-described

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- **React Team** - For the amazing framework
- **Firebase** - For backend infrastructure
- **Vercel** - For seamless deployment
- **Inter Font** - By Rasmus Andersson
- **Feather Icons** - Icon set inspiration

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/superboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/superboard/discussions)
- **Email**: support@superboard.app

---

## 🌐 Links

- **Live Demo**: [superboard.vercel.app](https://superboard.vercel.app)
- **Documentation**: [docs.superboard.app](https://docs.superboard.app)
- **Changelog**: [UPDATES.md](UPDATES.md)

---

<div align="center">

**Built with ❤️ using React and Firebase**

[⭐ Star this repo](https://github.com/yourusername/superboard) • [🐛 Report Bug](https://github.com/yourusername/superboard/issues) • [✨ Request Feature](https://github.com/yourusername/superboard/issues)

</div>