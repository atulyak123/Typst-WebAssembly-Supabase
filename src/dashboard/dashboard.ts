
import { getCurrentUser } from '../auth/auth';
import { deleteProject, fetchUserProjects, createNewProject, checkStorageAccess } from '../lib/projectService';

let isCreatingProject = false; 

export async function mountDashboard(root: HTMLElement) {
  root.innerHTML = `
    <div class="dashboard-layout">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="dashboard-title">📄 Typst Playground</h1>
            <span id="user-greeting" class="user-greeting">Welcome back!</span>
          </div>
          <div class="header-right">
            <button id="logout-btn" class="logout-btn">
              <span>🚪</span> Sign out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-main">
        <div class="dashboard-container">
          
          <!-- Create New Section -->
          <section class="create-section">
            <h2 class="section-title">Start Creating</h2>
            <div class="create-cards">
              <div class="create-card" id="create-empty">
                <div class="create-icon">+</div>
                <h3 class="create-title">Empty Document</h3>
                <p class="create-subtitle">Start from scratch</p>
              </div>
            </div>
          </section>

          <!-- My Projects Section -->
          <section class="projects-section">
            <div class="section-header">
              <h2 class="section-title">My Projects</h2>
              <div class="section-actions">
                <button id="refresh-btn" class="refresh-btn" title="Refresh">
                  <span>🔄</span>
                </button>
                <button id="view-toggle" class="view-toggle" title="Toggle view">
                  <span id="view-icon">⊞</span>
                </button>
              </div>
            </div>
            
            <div id="projects-grid" class="projects-grid">
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your projects...</p>
              </div>
            </div>
          </section>

          <!-- Shared with Me Section -->
          <section class="projects-section">
            <h2 class="section-title">Shared with Me</h2>
            <div id="shared-projects" class="projects-grid">
              <div class="empty-state">
                <div class="empty-icon">👥</div>
                <p class="empty-message">No shared projects yet</p>
                <p class="empty-subtitle">Projects shared by colleagues will appear here</p>
              </div>
            </div>
          </section>
          
        </div>
      </main>
    </div>
  `;

  // Initialize dashboard functionality
  await initializeDashboard();
}

async function initializeDashboard() {
  try {
    // Check storage access first
    const storageOK = await checkStorageAccess();
    if (!storageOK) {
      console.error('Storage access failed');
      return;
    }

    // Load user info
    const user = await getCurrentUser();
    if (user) {
      const greetingElement = document.getElementById('user-greeting');
      if (greetingElement) {
        const firstName = user.email?.split('@')[0] || 'User';
        greetingElement.textContent = `Welcome back, ${firstName}!`;
      }
    }

    // Setup event listeners
    setupDashboardEvents();
    
    // Load projects
    await loadProjects();
    
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

function setupDashboardEvents() {
  // Create empty document - FIXED: Prevent duplicate creation
  const createEmptyBtn = document.getElementById('create-empty');
  createEmptyBtn?.addEventListener('click', async () => {
    if (isCreatingProject) {
      console.log('Project creation already in progress');
      return;
    }
    await createNewDocument();
  });

  // Refresh projects
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn?.addEventListener('click', async () => {
    await loadProjects();
  });

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    try {
      const { signOut } = await import("../auth/auth");
      await signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });

  // View toggle (grid/list)
  const viewToggle = document.getElementById('view-toggle');
  const viewIcon = document.getElementById('view-icon');
  const projectsGrid = document.getElementById('projects-grid');
  
  viewToggle?.addEventListener('click', () => {
    const isGrid = projectsGrid?.classList.contains('grid-view');
    if (isGrid) {
      projectsGrid?.classList.remove('grid-view');
      projectsGrid?.classList.add('list-view');
      if (viewIcon) viewIcon.textContent = '☰';
    } else {
      projectsGrid?.classList.remove('list-view');
      projectsGrid?.classList.add('grid-view');
      if (viewIcon) viewIcon.textContent = '⊞';
    }
  });
}

async function createNewDocument() {
  if (isCreatingProject) {
    console.log('Already creating a project, ignoring duplicate request');
    return;
  }

  try {
    isCreatingProject = true;
    
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('You must be logged in to create a project');
    }
    const title = prompt("What would you like to name your document?", "My New Document");
    if (!title || !title.trim()) {
      console.log('User cancelled or entered empty title');
      return;
    }

    console.log('Creating new document for user:', user.id, 'with title:', title.trim());
    
    // Use the user-provided title instead of 'Untitled Document'
    const project = await createNewProject(user.id, title.trim());
    
    console.log('Project created successfully:', project);
    
    // Navigate to editor
    navigateToEditor(project.id);
    
  } catch (error) {
    console.error('Failed to create new document:', error);
    alert(`Failed to create new document: ${(error as Error).message}`);
  } finally {
    isCreatingProject = false;
  }
}

function navigateToEditor(projectId?: string) {
  // Use the global navigation function from index.html
  if (typeof (window as any).navigateToEditor === 'function') {
    (window as any).navigateToEditor(projectId);
  } else {
    // Fallback method
    const path = projectId ? `/editor/${projectId}` : '/editor';
    const fullPath = projectId ? `/Typst-WebAssembly/editor/${projectId}` : '/Typst-WebAssembly/editor';
    window.history.pushState({}, '', fullPath);
    window.location.reload();
  }
}

async function loadProjects() {
  const projectsGrid = document.getElementById('projects-grid');
  if (!projectsGrid) return;

  try {
    // Show loading state
    projectsGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your projects...</p>
      </div>
    `;

    console.log('Loading projects...');
    const projects = await fetchUserProjects();
    console.log('Projects loaded:', projects);

    if (!projects || projects.length === 0) {
      showEmptyState(projectsGrid);
    } else {
      // Map DB format to UI-friendly format
      const formattedProjects = projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: `Last modified: ${new Date(p.updated_at).toLocaleDateString()}`,
        lastModified: new Date(p.updated_at),
        typPath: p.typ_path,
        isOwner: true,
      }));

      renderProjects(projectsGrid, formattedProjects);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    showErrorState(projectsGrid);
  }
}

function renderProjects(container: HTMLElement, projects: any[]) {
  container.className = 'projects-grid grid-view';
  
  const projectsHTML = projects.map(project => `
    <div class="project-card" data-project-id="${project.id}">
      <div class="project-thumbnail">
        <div class="thumbnail-placeholder">
          <span class="thumbnail-icon">📄</span>
        </div>
      </div>
      <div class="project-info">
        <h3 class="project-title">${escapeHtml(project.title)}</h3>
        <p class="project-description">${escapeHtml(project.description)}</p>
        <div class="project-meta">
          <span class="project-date">${formatTimeAgo(project.lastModified)}</span>
          ${project.isOwner ? '' : '<span class="shared-badge">Shared</span>'}
        </div>
      </div>
      <div class="project-actions">
        <button class="project-menu-btn" data-project-id="${project.id}">⋯</button>
        <button class="delete-btn" title="Delete" data-project-id="${project.id}" data-typ-path="${project.typPath}">
          🗑
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = projectsHTML;

  // Add click handlers for opening projects
  container.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't open if clicking on action buttons
      if ((e.target as HTMLElement).closest('.project-actions')) {
        return;
      }
      
      const projectId = card.getAttribute('data-project-id');
      if (projectId) {
        console.log('Opening project:', projectId);
        navigateToEditor(projectId);
      }
    });
  });

  // Add delete handlers
  container.querySelectorAll<HTMLButtonElement>('.delete-btn')
    .forEach(btn => btn.addEventListener('click', async e => {
      e.stopPropagation();
      
      const projectId = btn.dataset.projectId!;
      const typPath = btn.dataset.typPath!;

      if (!confirm("Delete this project forever? This action cannot be undone.")) return;

      try {
        await deleteProject(projectId, typPath);
        btn.closest('.project-card')?.remove();
        if (!container.querySelector('.project-card')) {
          showEmptyState(container);
        }
      } catch (err) {
        console.error('Delete failed:', err);
        alert(`Delete failed: ${(err as Error).message}`);
      }
    }));
}

function showEmptyState(container: HTMLElement) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <p class="empty-message">No projects yet</p>
      <p class="empty-subtitle">Create your first document to get started</p>
      <button class="empty-cta" id="empty-cta-btn">
        Create Document
      </button>
    </div>
  `;
  
  const ctaBtn = container.querySelector('#empty-cta-btn');
  ctaBtn?.addEventListener('click', () => {
    createNewDocument();
  });
}

function showErrorState(container: HTMLElement) {
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">Failed to load projects</p>
      <button class="retry-btn" id="retry-btn">Try Again</button>
    </div>
  `;
  
  const retryBtn = container.querySelector('#retry-btn');
  retryBtn?.addEventListener('click', () => {
    loadProjects();
  });
}

// Utility functions
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}