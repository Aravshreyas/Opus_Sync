# OpusSync

OpusSync is a comprehensive, real-time workspace and project management platform designed to streamline team collaboration, task tracking, and communication. 

## Features

- **Workspace & Project Management**: Create isolated workspaces, invite members with specific roles, and manage multiple projects within each workspace.
- **Task Tracking**: Create, assign, and track tasks with status updates, priorities, and deadlines.
- **Real-Time Communication**: Integrated real-time chat and conversation threads for instant team communication.
- **Live Video & Audio Meetings**: Seamless integration with LiveKit for hosting team meetings directly within the platform.
- **AI Assistance**: Built-in AI integrations to assist with project planning and task management.
- **Calendar Integration**: Google Calendar sync for scheduling and tracking project milestones and meetings.
- **Role-Based Access Control (RBAC)**: Secure permission management to control what members can see and do within a workspace.

## Tech Stack

### Frontend
- **Framework**: React.js (via Vite)
- **Styling**: CSS / Tailwind (App.css, index.css)
- **API Communication**: Axios with custom interceptors
- **Routing**: React Router

### Backend
- **Environment**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Real-Time Engine**: Socket.io
- **Authentication**: JWT & Passport.js (Local + Google OAuth)
- **Media Storage**: Cloudinary integration
- **Video/Audio**: LiveKit seamless integration

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance
- Cloudinary Account (for media uploads)
- LiveKit Server (for real-time meetings)
- Google Cloud Console Project (for Google Auth and Calendar APIs)

### Setup Instructions

1. **Clone the repository**
2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the `backend` directory and add your API keys, database URI, and secret keys.
4. **Install Frontend Dependencies**:
   ```bash
   cd client
   npm install
   ```
5. **Run the Application**:
   - Start backend: `npm run dev` (in the `backend` folder)
   - Start frontend: `npm run dev` (in the `client` folder)
