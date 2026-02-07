-- ShareMyNotes Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  university TEXT,
  major TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses/Subjects table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE, -- e.g., "CS101"
  professor TEXT,
  semester TEXT, -- e.g., "Spring 2026"
  color TEXT DEFAULT '#3B82F6', -- For UI display
  icon TEXT DEFAULT 'book', -- Icon name for UI
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Course enrollment (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lectures/Rooms table (these are the Presence rooms)
CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lecture_number INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: FILE UPLOADS TABLE
-- =============================================

-- File uploads table - tracks all files uploaded by users
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- e.g., 'pdf', 'docx', 'png', 'jpg', 'txt'
  file_size INTEGER, -- Size in bytes
  file_url TEXT NOT NULL, -- Supabase Storage URL
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  
  -- Metadata
  title TEXT, -- User-given title
  description TEXT,
  tags TEXT[], -- Array of tags for searching
  
  -- Privacy & sharing
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: AI SUMMARIES TABLE
-- =============================================

-- AI Summaries table - stores AI-generated summaries for uploads
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Summary content
  summary_text TEXT NOT NULL, -- The AI-generated summary
  key_points TEXT[], -- Array of key points extracted
  topics TEXT[], -- Main topics identified
  
  -- AI metadata
  model_used TEXT DEFAULT 'gpt-4', -- Which AI model generated this
  tokens_used INTEGER,
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: NOTES TABLE (text-based notes)
-- =============================================

-- Notes table - for text-based notes (not file uploads)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- The note content (markdown supported)
  
  -- Privacy
  is_public BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 5: AI FEEDBACK TABLE
-- =============================================

-- AI Feedback table - feedback on notes or uploads
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Can be linked to either a note or an upload
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE,
  
  -- Feedback content
  feedback_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'grammar', 'content', 'structure'
  feedback_content TEXT NOT NULL,
  suggestions TEXT[], -- Array of specific suggestions
  score INTEGER CHECK (score >= 0 AND score <= 100), -- Optional quality score
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure feedback is linked to either note or upload
  CONSTRAINT feedback_target CHECK (note_id IS NOT NULL OR upload_id IS NOT NULL)
);

-- =============================================
-- STEP 6: ACTIVITY LOG (for tracking user actions)
-- =============================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  action_type TEXT NOT NULL, -- 'upload', 'view', 'download', 'share', 'summarize'
  target_type TEXT NOT NULL, -- 'upload', 'note', 'course', 'lecture'
  target_id UUID NOT NULL,
  
  metadata JSONB, -- Additional action-specific data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- COURSES POLICIES
CREATE POLICY "Courses are viewable by everyone" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create courses" ON public.courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Course creators can update their courses" ON public.courses
  FOR UPDATE USING (auth.uid() = created_by);

-- USER_COURSES POLICIES
CREATE POLICY "Users can view their own enrollments" ON public.user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unenroll themselves" ON public.user_courses
  FOR DELETE USING (auth.uid() = user_id);

-- LECTURES POLICIES
CREATE POLICY "Lectures are viewable by everyone" ON public.lectures
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lectures" ON public.lectures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPLOADS POLICIES
CREATE POLICY "Public uploads are viewable by everyone" ON public.uploads
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can upload their own files" ON public.uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON public.uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" ON public.uploads
  FOR DELETE USING (auth.uid() = user_id);

-- SUMMARIES POLICIES
CREATE POLICY "Users can view summaries of their uploads or public uploads" ON public.summaries
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.uploads WHERE uploads.id = summaries.upload_id AND uploads.is_public = true)
  );

CREATE POLICY "Users can create summaries for their uploads" ON public.summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTES POLICIES
CREATE POLICY "Public notes are viewable by everyone" ON public.notes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- FEEDBACK POLICIES
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback for themselves" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ACTIVITY_LOG POLICIES
CREATE POLICY "Users can view their own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log their own activity" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STEP 8: FUNCTIONS & TRIGGERS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON public.uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(table_name TEXT, row_id UUID)
RETURNS VOID AS $$
BEGIN
  IF table_name = 'uploads' THEN
    UPDATE public.uploads SET view_count = view_count + 1 WHERE id = row_id;
  ELSIF table_name = 'notes' THEN
    UPDATE public.notes SET view_count = view_count + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(upload_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.uploads SET download_count = download_count + 1 WHERE id = upload_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 9: SAMPLE DATA
-- =============================================

-- Insert some sample courses
INSERT INTO public.courses (name, description, code, professor, semester, color, icon) VALUES
  ('Introduction to Computer Science', 'Learn the fundamentals of programming and computer science', 'CS101', 'Dr. Smith', 'Spring 2026', '#3B82F6', 'code'),
  ('Calculus I', 'Introduction to differential and integral calculus', 'MATH101', 'Prof. Johnson', 'Spring 2026', '#10B981', 'calculator'),
  ('Physics for Engineers', 'Mechanics, thermodynamics, and waves', 'PHYS101', 'Dr. Williams', 'Spring 2026', '#F59E0B', 'atom'),
  ('Introduction to Psychology', 'Understanding human behavior and mental processes', 'PSY101', 'Prof. Davis', 'Spring 2026', '#EC4899', 'brain'),
  ('English Composition', 'Academic writing and critical thinking', 'ENG101', 'Dr. Brown', 'Spring 2026', '#8B5CF6', 'book')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- STEP 10: ENABLE REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.uploads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- =============================================
-- STEP 11: STORAGE BUCKET (run separately in Storage settings)
-- =============================================
-- In Supabase Dashboard > Storage, create a bucket named "uploads"
-- Then run these policies in the SQL Editor:

-- Storage policies for the uploads bucket
-- INSERT policy: Authenticated users can upload files to their own folder
-- CREATE POLICY "Users can upload to their own folder"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SELECT policy: Users can view their own files and public files
-- CREATE POLICY "Users can view own files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DELETE policy: Users can delete their own files
-- CREATE POLICY "Users can delete own files"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
