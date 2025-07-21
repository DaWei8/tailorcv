"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User, Plus, Edit, Trash2, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ParsedUserProfile, Profile } from "@/lib/schemas";
import ResumeToProfileCard from "@/components/ResumetoProfileCard";
// import { NextResponse } from "next/server";
import { PageHeading } from "@/components/PageHeading";
import LogoMain from "@/components/Logo";
import UserMenu from "@/components/UserMenu";


// const supabase = await createClient();
// const {
//   data: { user },
// } = await supabase.auth.getUser();

// if (!user) {
//   NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// }
const MAX_PROFILES = 3;

export default function ProfileManagementPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const router = useRouter();

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        toast.error("Failed to get user information");
        return;
      }
      setUserId(data.user.id);
    };
    getUserId();
  }, []);

  // Load profiles
  const loadProfiles = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load profiles");
      console.error(error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfiles();
    }
  }, [userId, loadProfiles]);


  // Create new profile
  const createProfile = async (full_name: string, headline: string) => {
    if (!userId) return;

    const supabase = createClient();
    const profileId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: profileId,
        user_id: userId,
        full_name,
        headline,
        is_master: profiles.length === 0
      });
    console.log("Create Profile Data:", data, "user id:", userId, "profile id:", profileId, "supabase:", supabase)

    if (error) {
      toast.error("Failed to create profile");
      console.error(error);
    } else {
      toast.success("Profile created successfully");
      loadProfiles();
      setShowCreateModal(false);
    }
  };

  // Update profile
  const updateProfile = async (profileId: string, full_name: string, headline: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("user_profiles")
      .update({ full_name, headline, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
      loadProfiles();
      setEditingProfile(null);
    }
  };

  // Delete profile
  const deleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      return;
    }

    const supabase = createClient();

    // Delete related data first
    const tables = ["experiences", "education", "certifications", "languages", "skills"];
    for (const table of tables) {
      await supabase.from(table).delete().eq("user_profile_id", profileId);
    }

    // Delete the profile
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to delete profile");
      console.error(error);
    } else {
      toast.success("Profile deleted successfully");
      loadProfiles();
    }
  };

  // Set master profile
  const setMasterProfile = async (profileId: string) => {
    const supabase = createClient();

    // First, unset all profiles as master
    await supabase
      .from("user_profiles")
      .update({ is_master: false })
      .eq("user_id", userId);

    // Then set the selected profile as master
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_master: true })
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to set master profile");
      console.error(error);
    } else {
      toast.success("Master profile updated");
      loadProfiles();
    }
  };
  const handleSaveSuccess = (profile: ParsedUserProfile) => {
    console.log('Profile saved:', profile);
    // Handle success (e.g., redirect, show notification)
  };

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    // Handle errors (e.g., show toast notification)
  };

  // Navigate to profile editor
  const editProfile = (profileId: string) => {
    router.push(`/dashboard/profile/${profileId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gap-4 bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <LogoMain />

            <UserMenu />
          </div>
        </div>
      </div>
      <PageHeading title="Profiles" />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Create New Profile Button */}
        {profiles.length < MAX_PROFILES && (
          <div className="mb-8 w-full flex items-center justify-between ">
            <div className="flex">
              <div className="inline-flex gap-1" >
                <div className={`w-12 h-12 rounded-full -mr-8 ${profiles.length >= 1 ? "bg-blue-300": "bg-gray-300"} border-2 border-gray-100 `} ></div>
                <div className={`w-12 h-12 rounded-full -mr-8 ${profiles.length >= 2 ? "bg-green-300": "bg-gray-300"} border-2 border-gray-100 `} ></div>
                <div className={`w-12 h-12 rounded-full -mr-8 ${profiles.length >= 3 ? "bg-yellow-300": "bg-gray-300"} border-2 border-gray-100 `} ></div>
              </div>
              <div className="text-sm px-3 py-2 gap-2 items-center justify-center flex w-fit bg-gray-100 rounded-3xl text-gray-500" >

                {profiles.length} / {MAX_PROFILES} profiles
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Profile
            </button>

          </div>
        )}

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="text-center w-full gap-6 py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
            <p className="text-gray-500 mb-6">Create your first profile to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </button>
            <ResumeToProfileCard
              apiEndpoint="/api/v1/parse-resume-to-profile"
              onError={handleError}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        ) : (

          <div className="md:grid flex space-y-6 flex-col-reverse md:grid-cols-2 lg:grid-cols-3 w-full gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`bg-white h-64 min-w-[250px] rounded-md flex flex-col justify-between shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${profile.is_master ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{profile.full_name}</h3>
                      {profile.is_master && (
                        <Star className="w-5 h-5 text-yellow-500 ml-2 fill-current" />
                      )}
                      {!profile.is_master && (
                        <button
                          title="Set as Master profile"
                          onClick={() => setMasterProfile(profile.id)}
                          className="flex w-fit items-center justify-center px-3 py-3 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{profile.headline || "No headline"}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex w-full gap-2">
                  <button
                    onClick={() => editProfile(profile.id)}
                    className="inline-flex w-full items-center justify-center px-3 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>

                  <div className="flex space-x-2">

                    <button
                      title="Delete button"
                      onClick={() => deleteProfile(profile.id)}
                      className="inline-flex items-center justify-center px-3 py-3 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {profile.is_master && (
                  <div className="mt-3 p-2 bg-yellow-100 rounded-md">
                    <p className="text-xs text-yellow-800 font-medium">
                      Master Profile - Used for resume generation
                    </p>
                  </div>
                )}
              </div>
            ))}
            {
              profiles.length === MAX_PROFILES ? <></> : <ResumeToProfileCard
                apiEndpoint="/api/v1/parse-resume-to-profile"
                onError={handleError}
                onSaveSuccess={handleSaveSuccess}
              />
            }
          </div>


        )}
      </div>

      {/* Create/Edit Profile Modal */}
      {(showCreateModal || editingProfile) && (
        <ProfileModal
          profile={editingProfile}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProfile(null);
          }}
          onSave={editingProfile
            ? (name, headline) => updateProfile(editingProfile.id, name, headline)
            : createProfile
          }
        />
      )}
    </div>
  );
}

// Modal Component for Create/Edit Profile
interface ProfileModalProps {
  profile?: Profile | null;
  onClose: () => void;
  onSave: (name: string, headline: string) => Promise<void>;
}

function ProfileModal({ profile, onClose, onSave }: ProfileModalProps) {
  const [name, setName] = useState(profile?.full_name || "");
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), headline.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex items-center justify-center w-full min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className=" absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="m-auto absolute top-[25%] flex self-center justify-self-center bg-white rounded-md text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form className="w-full h-full" onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {profile ? "Edit Profile" : "Create New Profile"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Software Engineer Profile"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headline
                  </label>
                  <textarea
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Brief headline of this profile"
                    rows={3}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : (profile ? "Update" : "Create")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}