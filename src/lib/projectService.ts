import { supabase } from "./superbaseClient";

export async function fetchUserProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data;
}

/* ---------- list projects for dashboard ---------- */
export async function listMyProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

// src/lib/projectService.ts
export async function loadProjectFile(path: string): Promise<string> {
  const { data, error } = await supabase
    .storage.from('user-projects')
    .download(path);

  // ── file is missing: start with empty buffer ──────────────────────
  if (error && (error.cause === 404 || error.name === 'StorageUnknownError'))
    return "";

  // ── any other error: bubble up ────────────────────────────────────
  if (error) throw error;

  return await data.text();
}

/* ---------- save Typst source & update timestamp ---------- */
export async function saveProjectFile(
  id: string,
  typPath: string,
  code: string,
) {
  // 1. Upload or overwrite the file
  await supabase
    .storage.from('user-projects')
    .upload(typPath, code, { upsert: true });

  // 2. Touch updated_at so dashboard re-sorts nicely
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function deleteProject(projectId: string, typPath: string) {
  // Step 1 – Delete file from Storage
  const { error: storageError } = await supabase
    .storage
    .from("user-projects")
    .remove([typPath]);

  if (storageError) throw new Error(`Storage delete failed: ${storageError.message}`);

  // Step 2 – Delete row from database
  const { error: dbError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (dbError) throw new Error(`DB delete failed: ${dbError.message}`);
}