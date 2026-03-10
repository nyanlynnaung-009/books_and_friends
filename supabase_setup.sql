-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  avatar_url text
);

-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create books table
create table public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  total_pages int not null,
  creator_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create reading_sessions table
create table public.reading_sessions (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  creator_id uuid references auth.users not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create session_participants table
create table public.session_participants (
  session_id uuid references public.reading_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  current_progress numeric default 0, -- can be page number or percentage
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (session_id, user_id)
);

-- Create comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.reading_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  parent_id uuid references public.comments on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create reactions table
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  reaction_type text not null
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;

-- Basic Policies (Allow read for everyone, insert/update for authenticated users)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Books are viewable by everyone" on public.books for select using (true);
create policy "Authenticated users can insert books" on public.books for insert with check (auth.role() = 'authenticated');

create policy "Reading sessions are viewable by everyone" on public.reading_sessions for select using (true);
create policy "Authenticated users can create sessions" on public.reading_sessions for insert with check (auth.role() = 'authenticated');

create policy "Participants are viewable by everyone" on public.session_participants for select using (true);
create policy "Authenticated users can join sessions" on public.session_participants for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own progress" on public.session_participants for update using (auth.uid() = user_id);

create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Authenticated users can insert comments" on public.comments for insert with check (auth.role() = 'authenticated');

create policy "Reactions are viewable by everyone" on public.reactions for select using (true);
create policy "Authenticated users can insert reactions" on public.reactions for insert with check (auth.role() = 'authenticated');
create policy "Users can delete their own reactions" on public.reactions for delete using (auth.uid() = user_id);
