// Client Workspace API Routes
// These routes support the Squarespace client module

import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { generateSecureProjectToken } from '../utils/tokenGenerator';
import { validateTokenFormat } from '../utils/tokenGenerator';

const router = Router();

// Middleware to validate project token
const validateProjectToken = async (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.params.token;
  
  if (!token || !validateTokenFormat(token)) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  try {
    // Verify token exists in database
    const project = await storage.getProjectByToken(token);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate token' });
  }
};

// Get project by member email
router.get('/member/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // First, find the company by member email
    const company = await storage.getCompanyByMemberEmail(email);
    
    if (!company) {
      return res.status(404).json({ error: 'No project found for this email' });
    }
    
    // Get active projects for this company
    const projects = await storage.getProjects({ 
      companyId: company.id,
      status: 'active'
    });
    
    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: 'No active projects found' });
    }
    
    // Get the most recent active project
    const project = projects[0];
    
    // Generate or retrieve project token
    let projectToken = project.clientToken;
    if (!projectToken) {
      projectToken = generateSecureProjectToken();
      await storage.updateProject(project.id, { clientToken: projectToken });
    }
    
    // Get order/billing information
    const orders = await storage.getOrdersByCompanyId(company.id);
    const activeOrder = orders.find(o => o.projectId === project.id) || orders[0];
    
    // Get milestones
    const milestones = await storage.getProjectMilestones(project.id);
    
    // Get designs
    const designs = await storage.getProjectDesigns(project.id);
    
    // Format response
    const response = {
      project: {
        id: project.id,
        name: project.name || `${project.type} Development`,
        companyName: company.name,
        progress: project.progress || 0,
        currentStage: project.stage || 'Planning',
        estimatedCompletion: project.estimatedCompletion,
        startDate: project.createdAt,
        
        billing: activeOrder ? {
          package: activeOrder.package || 'Professional',
          basePrice: activeOrder.subtotal || 0,
          addons: activeOrder.addons || [],
          subtotal: activeOrder.subtotal || 0,
          tax: activeOrder.tax || 0,
          total: activeOrder.total || 0,
          deposit: activeOrder.depositAmount || 0,
          remaining: (activeOrder.total || 0) - (activeOrder.paidAmount || 0),
          payments: activeOrder.payments || [],
          breakdown: {
            design: activeOrder.packageDescription || 'Custom website design',
            development: activeOrder.developmentDescription || 'Full website development',
            features: activeOrder.features || [
              'Mobile-responsive design',
              'Contact forms',
              'SEO optimization',
              'SSL certificate',
              '1 year hosting'
            ],
            timeline: activeOrder.timeline || '6-8 weeks'
          }
        } : null,
        
        designs: designs.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          imageUrl: d.imageUrl,
          version: d.version || 'v1',
          lastUpdated: d.updatedAt || d.createdAt,
          feedbackCount: d.feedbackCount || 0
        })),
        
        milestones: milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          status: m.status || 'pending',
          completedDate: m.completedDate,
          dueDate: m.dueDate
        }))
      },
      projectToken
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching project by member email:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Find or create a project for a member email
router.post('/member/:email/find-or-create', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.params.email || '';
    const email = String(rawEmail).trim().toLowerCase();
    const { companyName } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // 1) Find or create company by email
    let company = await storage.getCompanyByMemberEmail(email);

    if (!company) {
      const fallbackName = companyName || email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'New Client';
      company = await storage.createCompany({
        name: fallbackName,
        email,
        phone: '',
        address: '',
        city: '',
        state: '',
        industry: 'General',
        status: 'active',
        source: 'squarespace_module'
      } as any);
    }

    // 2) Find an active project or create one
    let projects = await storage.getProjects({ companyId: company.id, status: 'active' });
    let project = projects && projects.length > 0 ? projects[0] : undefined;

    if (!project) {
      const token = generateSecureProjectToken();
      project = await storage.createProject({
        companyId: company.id!,
        title: `${company.name} – Website Project`,
        type: 'website',
        stage: 'planning',
        status: 'active',
        progress: 0,
        notes: 'Auto-created from Squarespace module',
        accessToken: token
      } as any);
      // Ensure client token is set
      await storage.updateProject(project.id!, { clientToken: token });
    }

    // 3) Ensure a client token
    let projectToken = (project as any).clientToken;
    if (!projectToken) {
      projectToken = generateSecureProjectToken();
      await storage.updateProject(project.id!, { clientToken: projectToken });
    }

    // 4) Assemble response (reuse format from GET route)
    const orders = await storage.getOrdersByCompanyId(company.id!);
    const activeOrder = orders.find((o: any) => o.projectId === project!.id) || orders[0];
    const milestones = await storage.getProjectMilestones(project!.id!);
    const designs = await storage.getProjectDesigns(project!.id!);

    const response = {
      project: {
        id: project!.id,
        name: project!.name || `${(project as any).type || 'Website'} Development`,
        companyName: company.name,
        progress: (project as any).progress || 0,
        currentStage: (project as any).stage || 'Planning',
        estimatedCompletion: (project as any).estimatedCompletion,
        startDate: (project as any).createdAt,
        billing: activeOrder ? {
          package: activeOrder.package || 'Professional',
          basePrice: activeOrder.subtotal || 0,
          addons: activeOrder.addons || [],
          subtotal: activeOrder.subtotal || 0,
          tax: activeOrder.tax || 0,
          total: activeOrder.total || 0,
          deposit: activeOrder.depositAmount || 0,
          remaining: (activeOrder.total || 0) - (activeOrder.paidAmount || 0),
          payments: activeOrder.payments || [],
          breakdown: {
            design: activeOrder.packageDescription || 'Custom website design',
            development: activeOrder.developmentDescription || 'Full website development',
            features: activeOrder.features || [
              'Mobile-responsive design',
              'Contact forms',
              'SEO optimization',
              'SSL certificate',
              '1 year hosting'
            ],
            timeline: activeOrder.timeline || '6-8 weeks'
          }
        } : null,
        designs: (designs || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          imageUrl: d.imageUrl,
          version: d.version || 'v1',
          lastUpdated: d.updatedAt || d.createdAt,
          feedbackCount: d.feedbackCount || 0
        })),
        milestones: (milestones || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          status: m.status || 'pending',
          completedDate: m.completedDate,
          dueDate: m.dueDate
        }))
      },
      projectToken
    };

    return res.json(response);
  } catch (error) {
    console.error('Error find-or-create by member email:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project designs
router.get('/:id/designs', validateProjectToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const designs = await storage.getProjectDesigns(projectId);
    
    res.json(designs.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      version: d.version || 'v1',
      lastUpdated: d.updatedAt || d.createdAt,
      feedbackCount: d.feedbackCount || 0
    })));
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Submit design feedback
router.post('/:id/designs/:designId/feedback', validateProjectToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const designId = parseInt(req.params.designId);
    const { content, author } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }
    
    // Store feedback
    await storage.addDesignFeedback({
      projectId,
      designId,
      content,
      author: author || 'Client',
      timestamp: new Date().toISOString()
    });
    
    // Update feedback count
    await storage.incrementDesignFeedbackCount(designId);
    
    // Emit real-time update
    if (req.io) {
      req.io.to(`project-${projectId}`).emit('new_feedback', {
        designId,
        content,
        author,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// WebSocket authentication for project updates
router.post('/ws-auth', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token || !validateTokenFormat(token)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const project = await storage.getProjectByToken(token);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Generate temporary WebSocket token
    const wsToken = generateSecureProjectToken();
    
    // Store in temporary cache (expires in 1 hour)
    await storage.cacheWebSocketToken(wsToken, {
      projectId: project.id,
      companyId: project.companyId,
      expires: Date.now() + 3600000 // 1 hour
    });
    
    res.json({ wsToken, projectId: project.id });
  } catch (error) {
    console.error('Error authenticating WebSocket:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

export default router;
