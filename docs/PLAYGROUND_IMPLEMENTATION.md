# Playground Page Implementation

## Overview
The Playground page is a chat interface with a three-column layout:
1. **Global Sidebar** (existing) - Main navigation
2. **Playground Sidebar** - Server selector and chat thread list
3. **Chat Area** - Main chat interface

## Files Created

### Components
- `/components/playground/PlaygroundSidebar.tsx` - Internal sidebar with server dropdown and thread list
- `/components/playground/ChatArea.tsx` - Main chat interface with messages and input
- `/components/playground/index.tsx` - Export barrel file

### Pages
- `/app/playground/page.tsx` - Main playground page

### Updates
- `/components/app-sidebar.tsx` - Added "Playground" link to global navigation

## Features

### PlaygroundSidebar Component
- **Server Selector**: Dropdown to choose between different servers
- **New Thread Button**: Creates a new chat thread
- **Thread List**: Scrollable list of chat threads with:
  - Thread titles
  - Last message preview
  - Active state highlighting
  - Click to select

### ChatArea Component
- **Empty State**: 
  - Centered welcome message: "Hello there! How can I help you today?"
  - 4 starter prompt cards for quick actions
- **Chat Interface**:
  - Message bubbles with timestamps
  - User messages (right-aligned, primary color)
  - Assistant messages (left-aligned, muted background)
  - Loading indicator while processing
- **Input Area**:
  - Fixed at bottom
  - Text input with send button
  - Enter key to send
  - Disabled during loading

### Playground Page
- Uses existing `SidebarProvider` and `AppSidebar` for consistency
- Implements state management for:
  - Server selection
  - Thread selection
  - Messages
  - Loading states
- Mock data for demonstration (replace with real API calls)

## Styling
All components use:
- Existing Tailwind classes from the project
- shadcn/ui components (Card, Button, Input, Select, ScrollArea)
- Same color scheme as Dashboard
- Consistent spacing, shadows, and border radius
- Responsive design

## Layout Structure
```
┌─────────────┬──────────────────┬─────────────────────────┐
│   Global    │    Playground    │       Chat Area         │
│   Sidebar   │     Sidebar      │                         │
│  (existing) │   (250px wide)   │      (flex-1)           │
│             │                  │                         │
│ - Dashboard │ - Select Server  │ - Welcome Message       │
│ - Playground│ - + New Thread   │ - Starter Prompts       │
│ - Add Ctx   │ - Thread List    │ - Chat Messages         │
│ - Add Bot   │                  │ - Input (fixed bottom)  │
└─────────────┴──────────────────┴─────────────────────────┘
```

## Usage

Navigate to `/playground` to access the page.

### Customization Points

1. **Replace Mock Data**: Update the MOCK_SERVERS and MOCK_THREADS in `page.tsx`
2. **API Integration**: Implement real backend calls in `handleSendMessage`
3. **Thread Management**: Add persistence for chat threads
4. **Server Management**: Connect to real server list from backend

## Next Steps

- [ ] Connect to backend API for messages
- [ ] Implement real-time updates (WebSocket/SSE)
- [ ] Add message formatting (markdown, code blocks)
- [ ] Implement thread search/filter
- [ ] Add file upload capability
- [ ] Implement thread deletion/archiving
- [ ] Add user preferences (theme, font size)
