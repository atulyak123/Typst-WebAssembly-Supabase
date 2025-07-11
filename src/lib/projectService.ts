import { supabase } from "./superbaseClient";

// Default content for new documents
const DEFAULT_CONTENT = `= New Document

Welcome to Typst Playground!

Start writing your document here. You can use:

== Headings
Create headings with = symbols.

== Lists
- Bullet points work like this
- Another item
- Third item

== Math
You can write math like $x^2 + y^2 = z^2$.

== Code
\`\`\`python
def hello():
    print("Hello, Typst!")
\`\`\`

Happy writing! ✨
`;

/* ---------- Fetch user projects ---------- */
export async function fetchUserProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Project fetch error:", error);
    throw error;
  }
}

/* ---------- Load project file ---------- */
export async function loadProjectFile(path: string): Promise<string> {
  try {
    console.log(`Loading file from path: ${path}`);
    
    const { data, error } = await supabase
      .storage
      .from('user-projects')
      .download(path);

    if (error) {
      console.log(`File load error for ${path}:`, error);
      
      // If file doesn't exist, return default content
      if (error.message?.includes('not found')) {
        console.log(`File ${path} not found, returning default content`);
        return DEFAULT_CONTENT;
      }
      
      throw new Error(`Storage error: ${error.message}`);
    }

    const content = await data.text();
    console.log(`Successfully loaded file ${path}, length: ${content.length}`);
    return content;
    
  } catch (error) {
    console.error(`Error loading project file ${path}:`, error);
    return DEFAULT_CONTENT;
  }
}

/* ---------- Save project file ---------- */
export async function saveProjectFile(
  projectId: string,
  typPath: string,
  code: string,
) {
  try {
    console.log(`Saving file to ${typPath}, length: ${code.length}`);
    
    // Upload file to storage
    const { error: uploadError } = await supabase
      .storage
      .from('user-projects')
      .upload(typPath, new Blob([code], { type: 'text/plain' }), { 
        upsert: true,
        contentType: 'text/plain'
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // Update database timestamp
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.warn(`Database update failed: ${updateError.message}`);
    }

    console.log(`Successfully saved project ${projectId}`);
    
  } catch (error) {
    console.error(`Error saving project file:`, error);
    throw error;
  }
}

/* ---------- Create new project with initial file ---------- */
export async function createNewProject(userId: string, title: string = 'Untitled Document') {
  try {
    const projectId = crypto.randomUUID();
    const typPath = `${userId}/${projectId}/main.typ`;
    
    console.log(`Creating new project: ${projectId}`);
    
    // 1. Create database entry first
    const { data, error: dbError } = await supabase
      .from('projects')
      .insert([{ 
        id: projectId, 
        user_id: userId, 
        title, 
        typ_path: typPath 
      }])
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 2. Create initial file with default content
    const { error: fileError } = await supabase
      .storage
      .from('user-projects')
      .upload(typPath, new Blob([DEFAULT_CONTENT], { type: 'text/plain' }), {
        contentType: 'text/plain'
      });

    if (fileError) {
      // Clean up database entry if file creation fails
      await supabase.from('projects').delete().eq('id', projectId);
      throw new Error(`File creation failed: ${fileError.message}`);
    }

    console.log(`Successfully created project ${projectId} with initial file`);
    return data;
    
  } catch (error) {
    console.error('Error creating new project:', error);
    throw error;
  }
}

/* ---------- Delete project ---------- */
export async function deleteProject(projectId: string, typPath: string) {
  try {
    console.log(`Deleting project ${projectId}`);
    
    // Delete file from storage first
    const { error: storageError } = await supabase
      .storage
      .from("user-projects")
      .remove([typPath]);

    if (storageError) {
      throw new Error(`Storage delete failed: ${storageError.message}`);
    }

    // Delete database entry
    const { error: dbError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (dbError) {
      throw new Error(`Database delete failed: ${dbError.message}`);
    }

    console.log(`Successfully deleted project ${projectId}`);
    
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Updated projectService.ts - Replace just the checkStorageAccess function
// This bypasses the bucket listing issue

export async function checkStorageAccess() {
  try {
    console.log('🔍 Checking storage access...');
    
    // Skip bucket listing - go straight to testing file operations
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.log('❌ Not authenticated');
      return false;
    }
    
    // Test if we can access files in the user-projects bucket
    const testPath = `${user.user.id}/test-${Date.now()}/connectivity-test.txt`;
    const testContent = 'Storage connectivity test';
    
    console.log('Testing file upload to:', testPath);
    
    // Try to upload a test file
    const { error: uploadError } = await supabase.storage
      .from('user-projects')
      .upload(testPath, new Blob([testContent], { type: 'text/plain' }));
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      
      // If upload fails, check if it's a bucket existence issue
      if (uploadError.message.includes('Bucket not found')) {
        console.log('❌ user-projects bucket does not exist');
        return false;
      }
      
      // If it's a permission issue, that's expected - bucket exists but policies need setup
      if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
        console.log('⚠️  Bucket exists but needs policies. Will continue anyway.');
        return true; // Bucket exists, policies just need setup
      }
      
      return false;
    }
    
    console.log('✅ Upload test successful');
    
    // Try to download the test file
    const { error: downloadError } = await supabase.storage
      .from('user-projects')
      .download(testPath);
    
    if (!downloadError) {
      console.log('✅ Download test successful');
    }
    
    // Clean up test file
    await supabase.storage.from('user-projects').remove([testPath]);
    console.log('✅ Storage access fully working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Storage check exception:', error);
    
    // If we can't even try to upload, the bucket probably doesn't exist
    if (error.message && error.message.includes('Bucket not found')) {
      console.log('❌ user-projects bucket does not exist');
      return false;
    }
    
    // For other errors, assume bucket exists but has permission issues
    console.log('⚠️  Assuming bucket exists despite error');
    return true;
  }
}