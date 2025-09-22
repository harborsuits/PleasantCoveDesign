// Extensions to the storage module for client workspace functionality
import { storage } from './storage';
import { memoryDb } from './db';

// Extend the Storage class with new methods
export const extendStorage = () => {
  // Get company by member email
  storage.getCompanyByMemberEmail = async function(email: string) {
    // Check if the email is associated with any company
    const companies = await this.getCompanies();
    return companies.find(company => 
      company.email === email || 
      company.memberEmails?.includes(email) ||
      company.contactEmail === email
    );
  };

  // Get project by client token
  storage.getProjectByToken = async function(token: string) {
    const projects = await this.getProjects({});
    return projects.find(project => project.clientToken === token);
  };

  // Get orders by company ID
  storage.getOrdersByCompanyId = async function(companyId: number) {
    const orders = await this.getOrders();
    return orders.filter(order => order.companyId === companyId);
  };

  // Get project milestones
  storage.getProjectMilestones = async function(projectId: number) {
    // If milestones table doesn't exist, create mock data
    if (!memoryDb.milestones) {
      memoryDb.milestones = [];
    }
    
    let milestones = memoryDb.milestones.filter(m => m.projectId === projectId);
    
    // If no milestones exist, create default ones
    if (milestones.length === 0) {
      const defaultMilestones = [
        {
          id: Date.now() + 1,
          projectId,
          title: 'Project Kickoff & Discovery',
          description: 'Initial consultation and requirements gathering',
          status: 'completed',
          completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          order: 1
        },
        {
          id: Date.now() + 2,
          projectId,
          title: 'Design & Mockups',
          description: 'Create visual designs and get approval',
          status: 'current',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          order: 2
        },
        {
          id: Date.now() + 3,
          projectId,
          title: 'Development',
          description: 'Build website with all features',
          status: 'pending',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          order: 3
        },
        {
          id: Date.now() + 4,
          projectId,
          title: 'Testing & Launch',
          description: 'Test all features and deploy live',
          status: 'pending',
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          order: 4
        }
      ];
      
      memoryDb.milestones.push(...defaultMilestones);
      milestones = defaultMilestones;
    }
    
    return milestones.sort((a, b) => a.order - b.order);
  };

  // Get project designs
  storage.getProjectDesigns = async function(projectId: number) {
    // If designs table doesn't exist, create it
    if (!memoryDb.designs) {
      memoryDb.designs = [];
    }
    
    let designs = memoryDb.designs.filter(d => d.projectId === projectId);
    
    // If no designs exist, create mock ones
    if (designs.length === 0) {
      const mockDesigns = [
        {
          id: Date.now() + 1,
          projectId,
          title: 'Homepage Design',
          description: 'Main landing page with hero section',
          imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23667eea"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="18"%3EHomepage Design%3C/text%3E%3C/svg%3E',
          version: 'v1',
          createdAt: new Date().toISOString(),
          feedbackCount: 0
        },
        {
          id: Date.now() + 2,
          projectId,
          title: 'Services Page',
          description: 'Services and pricing information',
          imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23764ba2"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="18"%3EServices Page%3C/text%3E%3C/svg%3E',
          version: 'v1',
          createdAt: new Date().toISOString(),
          feedbackCount: 0
        }
      ];
      
      memoryDb.designs.push(...mockDesigns);
      designs = mockDesigns;
    }
    
    return designs;
  };

  // Add design feedback
  storage.addDesignFeedback = async function(feedback: any) {
    if (!memoryDb.designFeedback) {
      memoryDb.designFeedback = [];
    }
    
    const newFeedback = {
      id: Date.now(),
      ...feedback
    };
    
    memoryDb.designFeedback.push(newFeedback);
    return newFeedback;
  };

  // Increment design feedback count
  storage.incrementDesignFeedbackCount = async function(designId: number) {
    if (memoryDb.designs) {
      const design = memoryDb.designs.find(d => d.id === designId);
      if (design) {
        design.feedbackCount = (design.feedbackCount || 0) + 1;
      }
    }
  };

  // Cache WebSocket token
  storage.cacheWebSocketToken = async function(token: string, data: any) {
    if (!memoryDb.wsTokenCache) {
      memoryDb.wsTokenCache = {};
    }
    
    memoryDb.wsTokenCache[token] = data;
    
    // Clean up expired tokens
    setTimeout(() => {
      if (memoryDb.wsTokenCache[token] && memoryDb.wsTokenCache[token].expires < Date.now()) {
        delete memoryDb.wsTokenCache[token];
      }
    }, data.expires - Date.now());
  };

  // Update project with new fields
  const originalUpdateProject = storage.updateProject;
  storage.updateProject = async function(projectId: number, updates: any) {
    // Call original method if it exists
    if (originalUpdateProject) {
      return originalUpdateProject.call(this, projectId, updates);
    }
    
    // Otherwise implement it
    const projects = memoryDb.projects || [];
    const project = projects.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates, { updatedAt: new Date() });
      return project;
    }
    return null;
  };
};

// Apply extensions immediately
extendStorage();
