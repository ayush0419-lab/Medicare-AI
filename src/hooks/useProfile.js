import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const { user, profile, fetchProfile, updateProfile: authUpdateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateAvatar = async (file) => {
    if (!user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await authUpdateProfile({ avatar_url: publicUrl });
      toast.success('Avatar updated!');
      return publicUrl;
    } catch (error) {
      toast.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (data) => {
    setLoading(true);
    try {
      await authUpdateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    updateAvatar,
    updateProfileData,
    refreshProfile: () => user && fetchProfile(user.id)
  };
};
