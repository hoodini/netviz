<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

<h1 align="center">
  🌐 NetViz
</h1>

<p align="center">
  <strong>A real-time network request visualizer with animated topology, timing waterfalls, and live traffic simulation.</strong>
</p>

<p align="center">
  <em>Built as a demo project for a GitHub Copilot training workshop — showcasing modern React patterns, canvas animations, and dark-themed data visualization.</em>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🗺️ Animated Topology** | Live canvas rendering of network topology — Client, CDN, API Gateway, Server, and Database nodes with glowing packet animations traversing the graph in real time |
| **📋 Request Log** | Scrollable feed of captured HTTP requests with method badges, status codes, response times, and payload sizes |
| **🔍 Request Inspector** | Deep-dive panel showing full request/response headers, payload preview, and per-phase timing breakdown |
| **📊 Timing Waterfall** | Visual breakdown of each request phase — DNS lookup, TCP connect, TLS handshake, request send, and response download |
| **📈 Live Stats Dashboard** | Real-time KPIs: total requests, success/error counts, average response time, data transferred, and requests/sec |
| **🎮 Capture Controls** | Start/pause traffic capture, clear logs, and color-coded method legend (GET, POST, PUT, PATCH, DELETE) |

## 🎨 Design

- **Dark theme by default** — deep navy surfaces (`#0a0e17`) with vibrant accent colors
- **Glass-morphism panels** with subtle borders and backdrop effects
- **Canvas-rendered topology** with radial glow effects, dashed edges, and animated packet trails
- **Color-coded HTTP methods** — Blue (GET), Green (POST), Yellow (PUT), Red (DELETE/Error), Purple (PATCH)
- **Responsive grid layout** — adapts from mobile to widescreen

## 🏗️ Architecture

### System Overview

```mermaid
flowchart TB
    subgraph UI["🎨 User Interface"]
        App[App Component]
        Controls[ControlBar<br/>Start/Pause/Clear]
        Stats[StatsBar<br/>Live KPIs]
        Topology[TopologyCanvas<br/>Animated Network Graph]
        RequestLog[RequestList<br/>HTTP Request Feed]
        Inspector[RequestInspector<br/>Request Details]
        Waterfall[TimingWaterfall<br/>Phase Breakdown]
    end
    
    subgraph State["⚡ State Management"]
        Hook[useNetworkCapture Hook]
        ReqState[(Requests State)]
        PktState[(Packets State)]
        StatState[(Stats State)]
    end
    
    subgraph Services["🔧 Services & Utils"]
        Mock[mockTraffic.ts<br/>Traffic Generator]
        Colors[colors.ts<br/>Theme & Utils]
        Types[network.ts<br/>Type Definitions]
    end
    
    App --> Controls
    App --> Stats
    App --> Topology
    App --> RequestLog
    App --> Inspector
    App --> Waterfall
    
    Controls -->|User Actions| Hook
    RequestLog -->|Selection| Inspector
    Inspector --> Waterfall
    
    Hook --> ReqState
    Hook --> PktState
    Hook --> StatState
    
    Hook -->|Generate Traffic| Mock
    Hook -->|Format Data| Colors
    
    ReqState -.->|Subscribe| Stats
    ReqState -.->|Subscribe| RequestLog
    PktState -.->|Subscribe| Topology
    StatState -.->|Subscribe| Stats
    
    Types -.->|Type Safety| Hook
    Types -.->|Type Safety| Mock
    
    classDef uiClass fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef stateClass fill:#10b981,stroke:#059669,color:#fff
    classDef serviceClass fill:#8b5cf6,stroke:#7c3aed,color:#fff
    
    class Controls,Stats,Topology,RequestLog,Inspector,Waterfall,App uiClass
    class Hook,ReqState,PktState,StatState stateClass
    class Mock,Colors,Types serviceClass
```

### Component Hierarchy

```mermaid
flowchart LR
    Root[🌐 App.tsx]
    Root --> Bar1[ControlBar]
    Root --> Bar2[StatsBar]
    Root --> Canvas[TopologyCanvas]
    Root --> List[RequestList]
    Root --> Inspect[RequestInspector]
    
    Inspect --> Water[TimingWaterfall]
    
    Root -.->|useNetworkCapture| Hook[useNetworkCapture Hook]
    Hook -.->|mockTraffic| Mock[Traffic Generator]
    
    classDef component fill:#0ea5e9,stroke:#0284c7,color:#fff
    classDef hook fill:#f59e0b,stroke:#d97706,color:#fff
    classDef service fill:#ec4899,stroke:#db2777,color:#fff
    
    class Root,Bar1,Bar2,Canvas,List,Inspect,Water component
    class Hook hook
    class Mock service
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Hook as useNetworkCapture
    participant Mock as mockTraffic
    participant State as React State
    
    User->>UI: Click "Start Capture"
    UI->>Hook: handleStartCapture()
    activate Hook
    Hook->>Mock: generateRequest()
    Mock-->>Hook: NetworkRequest object
    Hook->>State: Update requests[]
    Hook->>State: Update packets[]
    Hook->>State: Update stats
    deactivate Hook
    
    State-->>UI: Re-render
    UI-->>User: Display updated visuals
    
    loop Every 1-3 seconds
        Hook->>Mock: generateRequest()
        Mock-->>Hook: New request
        Hook->>State: Append to state
        State-->>UI: Trigger re-render
    end
    
    User->>UI: Select request
    UI->>Hook: setSelectedRequest(id)
    Hook->>State: Update selection
    State-->>UI: Show Inspector panel
```

### File Structure

```
src/
├── components/
│   ├── TopologyCanvas.tsx    # Canvas-based network topology with packet animation
│   ├── RequestList.tsx       # Scrollable request log with selection
│   ├── RequestInspector.tsx  # Detailed request/response viewer
│   ├── TimingWaterfall.tsx   # Per-phase timing visualization
│   ├── StatsBar.tsx          # Live KPI stat cards
│   └── ControlBar.tsx        # Capture toggle, clear, and legend
├── hooks/
│   └── useNetworkCapture.ts  # Core state management — requests, packets, stats
├── services/
│   └── mockTraffic.ts        # Realistic mock HTTP traffic generator
├── types/
│   └── network.ts            # TypeScript interfaces for the domain model
└── utils/
    └── colors.ts             # Color mappings, formatters, and ID generation
```

### Key Patterns

- **Zero external state libraries** — pure React hooks (`useState`, `useCallback`, `useRef`, `useEffect`)
- **`requestAnimationFrame` loop** for silky-smooth 60fps packet animations
- **Mock traffic engine** generating realistic HTTP requests with randomized timing phases, status codes, headers, and payloads
- **Canvas 2D API** with HiDPI scaling, radial gradients, glow effects, and motion trails
- **Strict TypeScript** — no `any`, fully typed domain model

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**

### Install & Run

```bash
# Clone the repository
git clone https://github.com/hoodini/netviz.git
cd netviz

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — traffic simulation starts automatically.

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18 with functional components |
| **Language** | TypeScript (strict mode) |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3.4 (dark mode, custom design tokens) |
| **Animations** | Canvas 2D API + requestAnimationFrame |
| **State** | React hooks only |

## 🎯 Workshop Context

This project was built as part of a **GitHub Copilot training workshop** to demonstrate:

- AI-assisted development workflows with Copilot
- Real-time data visualization in React
- Canvas animations and custom rendering
- TypeScript-first development with strict typing
- Modern frontend architecture patterns

## 📄 License

MIT

---

<p align="center">
  Built with ☕ and GitHub Copilot by <a href="https://github.com/hoodini">Yuval Avidani</a> — <a href="https://yuv.ai">YUV.AI</a>
</p>
