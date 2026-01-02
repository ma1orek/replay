"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Profile might not exist yet, create it
        if (error.code === "PGRST116") {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name: null,
              avatar_url: null,
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
          }
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      await refreshProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [user, refreshProfile]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const supabase = createClient();
      
      // Create unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const result = await updateProfile({ avatar_url: avatarUrl });
      
      if (result.success) {
        return { success: true, url: avatarUrl };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      return { success: false, error: err.message };
    }
  }, [user, updateProfile]);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refreshProfile, updateProfile, uploadAvatar }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}



