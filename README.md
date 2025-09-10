# FlexCore Electron App

A modern Electron application with a custom titlebar and frameless window, styled to match the FlexCore dark theme.

## Features

- **Frameless Window**: Custom titlebar with window controls (minimize, maximize, close)
- **Modern UI**: Dark theme matching FlexCore design aesthetic
- **Secure**: Built with Electron security best practices
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Responsive**: Adaptive layout for different screen sizes

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

## Development

Run in development mode with hot reload:
```bash
npm run dev
```

## Building

Build the application for distribution:
```bash
npm run build
```

## Project Structure

```
src/
├── main/           # Main Electron process
│   └── main.js     # Application entry point
├── preload/        # Preload scripts for security
│   └── preload.js  # Context bridge for renderer
└── renderer/       # Renderer process (UI)
    ├── index.html  # Main HTML file
    ├── styles.css  # Application styles
    └── renderer.js # UI logic and interactions
```

## Security

This application follows Electron security best practices:
- Context isolation enabled
- Node integration disabled
- Remote module disabled
- Secure preload script with context bridge
- Content Security Policy implemented

## License

MIT