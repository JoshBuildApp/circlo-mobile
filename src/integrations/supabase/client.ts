import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Initialize chat-files bucket if it doesn't exist
const initializeChatStorage = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const chatBucketExists = buckets?.some(bucket => bucket.name === 'chat-files');
    
    if (!chatBucketExists) {
      // Create chat-files bucket
      const { error } = await supabase.storage.createBucket('chat-files', {
        public: true,
        allowedMimeTypes: ['image/*', 'audio/*'],
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        console.error('Error creating chat-files bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing chat storage:', error);
  }
};

// Initialize storage on client setup
initializeChatStorage();