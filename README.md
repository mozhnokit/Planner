# Team Flow Planner

Collaborative, high-performance Task Planner web application built with Next.js, Supabase, and modern UI/UX principles.

## 🚀 Features

- **Real-time Collaboration**: See changes instantly as teammates make them
- **Task Management**: Create, edit, delete tasks with priorities, deadlines, and assignees
- **Priority Levels**: Low, Medium, High, Urgent with distinct color coding
- **Drag-and-Drop**: Reorder tasks and change status with intuitive drag-and-drop
- **Comments System**: Discuss tasks with team members in real-time
- **Online Presence**: See who's currently viewing the workspace
- **Smart Filters**: Filter by "My Tasks", "Urgent", or search
- **Dark Theme**: Modern glassmorphism design with deep grays and accent colors
- **Fully Responsive**: Works perfectly on mobile and desktop

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI (custom implementation)
- **Animations**: Framer Motion
- **Backend/Real-time**: Supabase (Auth, PostgreSQL, Real-time subscriptions)
- **Drag-and-Drop**: @dnd-kit
- **TypeScript**: Full type safety

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

## 🔧 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Get your project URL and anon key from Settings → API

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles & theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── auth/              # Authentication components
│   ├── tasks/             # Task-related components
│   └── ui/                # Reusable UI components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & configurations
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript types
```

## 🎨 Design Features

- **Glassmorphism Effect**: Cards and modals with backdrop blur
- **Color-coded Priorities**: Visual hierarchy for task importance
- **Smooth Animations**: Framer Motion for all transitions
- **Responsive Layout**: Mobile-first approach
- **Dark Theme**: Easy on the eyes for extended use

## 📝 Database Schema

The application uses the following tables:

- `profiles` - User profiles
- `tasks` - Task records
- `comments` - Task comments
- `task_history` - Change log
- `presence` - Online status

All tables have Row Level Security (RLS) policies for data protection.

## 🔐 Authentication

Uses Supabase Auth with email/password. Features include:

- Secure password hashing
- JWT-based sessions
- Automatic profile creation on signup
- Real-time presence updates

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set the same `.env.local` variables in your deployment platform.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
