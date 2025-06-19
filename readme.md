# Electron Drawing App

A cross-platform drawing application built with **Electron** and **React**, designed for macOS (with support for Windows/Linux). Draw, select, move, and delete sketches directly over your desktop with a transparent fullscreen overlay.

---

## ✨ Features

- **Transparent Fullscreen Canvas**: Draw over your desktop or any window.
- **Pencil Tool (F1)**: Freehand drawing with your chosen color.
- **Selector Tool (F2)**: Select, move, and delete strokes.
- **Clear Canvas (F3)**: Instantly erase all drawings.
- **Color Picker**: Minimal floating UI to choose your drawing color.
- **Keyboard Shortcuts**:
  - `F1`: Pencil Tool
  - `F2`: Selector Tool
  - `F3`: Clear Canvas
  - `Backspace`: Delete selected object(s)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone the repository
$ cd draw-on-screen

# Install dependencies
$ yarn install
# or
$ npm install
```

### Running the App

```bash
# Start the Electron app in development mode
$ yarn start
# or
$ npm start
```

---

## 🖥️ Platform Compatibility
- **macOS** (primary target, with proper transparency and overlay permissions)
- **Windows/Linux** (supported, but may have minor differences)

---


## 📦 Packaging & Distribution

To build distributable packages:

```bash
$ yarn make
# or
$ npm run make
```

---

## 📝 License

MIT

---

## 🙏 Credits

Created by Luiz Barros. Contributions welcome!
