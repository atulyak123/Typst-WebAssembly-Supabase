// src/dashboard/dashboard.ts - Create this new file

import { getCurrentUser } from '../auth/auth';
import { deleteProject, fetchUserProjects } from '../lib/projectService';
import { supabase } from '../lib/superbaseClient';

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
    
    // Load projects (we'll implement this next)
    await loadProjects();
    
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

function setupDashboardEvents() {
  // Create empty document
  const createEmptyBtn = document.getElementById('create-empty');
  createEmptyBtn?.addEventListener('click', () => {
    createNewDocument();
  });

  // Create from template (placeholder for now)
  const createTemplateBtn = document.getElementById('create-template');
  createTemplateBtn?.addEventListener('click', () => {
    alert('Templates coming soon! For now, use "Empty Document"');
  });

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
logoutBtn?.addEventListener(
  "click",
  async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    try {
      const { signOut } = await import("../auth/auth");
      await signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  },
  { once: true }         
);


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
  const user = await getCurrentUser();
  if (!user) {
    alert('You must be logged in to create a project');
    return;
  }

  const title = 'Untitled Document';
const projectId = crypto.randomUUID();         
const typPath   = `${user.id}/${projectId}/main.typ`;


  const { data, error } = await supabase.from('projects')
  .insert([{ id: projectId, user_id: user.id, title, typ_path: typPath }]).select().single();

  if (error) {
    console.error('Failed to create new project:', error);
    alert('Failed to create new project');
    return;
  }

  // Redirect to editor with new project ID
navigateToEditor(projectId);
}

function navigateToEditor(projectId?: string) {
  // Update URL and trigger route handler
  const url = projectId ? `/editor/${projectId}` : '/editor';
  window.history.pushState({ projectId }, '', url);
  
  // Trigger the route handler from index.html
  window.dispatchEvent(new PopStateEvent('popstate'));
}



async function loadProjects() {
  const projectsGrid = document.getElementById('projects-grid');
  if (!projectsGrid) return;

  try {
    const projects = await fetchUserProjects();

    if (!projects || projects.length === 0) {
      showEmptyState(projectsGrid);
    } else {
      // Map DB format to UI-friendly format
      const formattedProjects = projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: `Last saved file: ${p.typ_path}`,
        lastModified: new Date(p.updated_at),
        isOwner: true, // all are user-owned for now
      }));

      renderProjects(projectsGrid, formattedProjects);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    showErrorState(projectsGrid);
  }
}

function renderProjects(container: HTMLElement, projects: any[]) {
  container.className = 'projects-grid grid-view'; // Start with grid view
  
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
      <button class="delete-btn" title="Delete" data-project-id="${project.id}" data-typ-path="${project.typ_path}">
        🗑
     </button>
    </div>
    </div>
  `).join('');

  container.innerHTML = projectsHTML;

  // Add click handlers
  container.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('project-menu-btn')) {
        return; // Don't open project if clicking menu button
      }
      const projectId = card.getAttribute('data-project-id');
      if (projectId) {
        navigateToEditor(projectId);
      }
    });
  });
  /* open on card click (already there) … */

/* 🗑 delete click */
container.querySelectorAll<HTMLButtonElement>('.delete-btn')
  .forEach(btn => btn.addEventListener('click', async e => {
    e.stopPropagation();                       // prevent card click
    const id      = btn.dataset.projectId!;
    const typPath = btn.dataset.typPath!;

    if (!confirm("Delete this project forever?")) return;

    try {
      await deleteProject(id, typPath);
      // remove card from DOM immediately
      btn.closest('.project-card')?.remove();
      // If none left, rebuild empty state
      if (!container.querySelector('.project-card')) {
        showEmptyState(container);
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err as any).message);
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
  
  // Add event listener to the button
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
  
  // Add event listener to the retry button
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