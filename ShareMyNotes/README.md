# ShareMyNotes 📚

A collaborative note-sharing app built for hackathon, where students can share notes, collaborate in real-time, and get AI-powered feedback.

## Features

- 🔐 **Authentication** - Sign up/login with email or Google OAuth
- 📖 **Course Selection** - Choose subjects to share notes from
- 👥 **Real-time Presence** - See who's online in lecture rooms (Supabase Presence)
- 📝 **Note Sharing** - Upload and share notes with privacy controls
- 🤖 **AI Feedback** - Get personalized feedback powered by ChatGPT API

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime/Presence)
- **AI**: OpenAI API (ChatGPT)
- **Styling**: Tailwind CSS with warm paper-inspired theme

## Getting Started

### 1. Install Dependencies

```bash
cd ShareMyNotes
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the `supabase-schema.sql` file
3. Enable Google OAuth in Authentication > Providers (optional)
4. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── signin/
│   │   ├── signup/
│   │   └── callback/
│   ├── courses/           # Course selection (TODO)
│   ├── lecture/           # Lecture rooms with Presence (TODO)
│   ├── layout.tsx
│   ├── page.tsx           # Landing page
│   └── globals.css
├── components/            # Reusable components
│   ├── Button/
│   ├── Icon/
│   └── Toast/
└── lib/                   # Utilities
    ├── supabase/          # Supabase client setup
    │   ├── client.ts
    │   ├── server.ts
    │   └── middleware.ts
    └── constants.ts
```

## Next Steps (To Build)

1. ✅ Project setup and authentication
2. ⏳ Course selection page
3. ⏳ Lecture room with Supabase Presence
4. ⏳ Note upload functionality
5. ⏳ AI feedback integration
6. ⏳ Privacy controls for notes

## License

MIT
