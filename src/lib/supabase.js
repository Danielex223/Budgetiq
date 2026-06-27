import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fwyawklpdzpeeovmootn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWF3a2xwZHpwZWVvdm1vb3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzEzNzgsImV4cCI6MjA5ODE0NzM3OH0.x_s7n46HMKKFjsk2GdecsRkxEgVgXpH9Mdgp2M3NAds";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);