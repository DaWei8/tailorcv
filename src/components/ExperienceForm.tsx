"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ExperienceForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [desc, setDesc] = useState("");

  const handle = async () => {
    const user = await supabase.auth.getUser();
    await supabase.from("experiences").insert({
      profile_id: user.data.user?.id,
      job_title: title,
      company,
      description: desc,
    });
    toast.success("Added");
    onSaved();
  };

  return (
    <div className="space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job Title" className="input" />
      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="input" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="input" rows={3} />
      <button onClick={handle} className="btn-primary">Add</button>
    </div>
  );
}