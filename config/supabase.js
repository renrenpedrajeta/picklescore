import { createClient } from '@supabase/supabase-js';

const databaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!databaseURL) {
    throw new Error("Supabase Inaccessible");
}
if (!publicKey) {
    throw new Error("Supabase url working, some configuration info is missing");
}

export const supabase = createClient(databaseURL, publicKey);