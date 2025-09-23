import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { generateSecureProjectToken } from '../utils/tokenGenerator';

const router = Router();

// Middleware to require admin authentication
const requireAdmin = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  
  if (token !== 'pleasantcove2024admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Generate access token for a project
router.post('/projects/:id/generate-token', requireAdmin, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Get project
    const project = await storage.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if token already exists
    if (project.accessToken) {
      return res.json({ 
        token: project.accessToken,
        message: 'Token already exists' 
      });
    }
    
    // Generate new secure token
    const tokenData = generateSecureProjectToken('admin_generated', `project_${projectId}`);
    
    // Update project with new token
    await storage.updateProject(projectId, {
      accessToken: tokenData.token
    });
    
    // Log activity
    await storage.createActivity({
      type: 'token_generated',
      description: `Access token generated for project: ${project.title}`,
      companyId: project.companyId,
      projectId: projectId
    });
    
    res.json({ 
      token: tokenData.token,
      message: 'Token generated successfully' 
    });
    
  } catch (error) {
    console.error('Error generating project token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Get project by token (for client access)
router.get('/projects/token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Validate token format
    if (!token || token.length < 32) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    
    // Find project by token
    const project = await storage.getProjectByToken(token);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get company info
    const company = await storage.getCompanyById(project.companyId);
    
    // Get related data
    const orders = await storage.getOrdersByCompanyId(project.companyId);
    const milestones = await storage.getProjectMilestones(project.id);
    const designs = await storage.getProjectDesigns(project.id);
    
    // Format response
    const response = {
      project: {
        id: project.id,
        name: project.title || 'Project',
        companyName: company?.name || 'Client',
        contactName: company?.contactName || company?.name || 'Client',
        progress: project.progress || 0,
        currentStage: project.stage || 'Planning',
        estimatedCompletion: project.estimatedCompletion,
        startDate: project.createdAt,
        billing: orders[0] ? {
          package: orders[0].package || 'Professional',
          basePrice: orders[0].subtotal || 0,
          addons: orders[0].addons || [],
          subtotal: orders[0].subtotal || 0,
          tax: orders[0].tax || 0,
          total: orders[0].total || 0,
          deposit: orders[0].depositAmount || 0,
          remaining: (orders[0].total || 0) - (orders[0].paidAmount || 0),
          payments: orders[0].payments || [],
          breakdown: {
            design: orders[0].packageDescription || 'Custom website design',
            development: orders[0].developmentDescription || 'Full website development',
            features: orders[0].features || [],
            timeline: orders[0].timeline || '6-8 weeks'
          }
        } : null,
        designs: designs,
        milestones: milestones
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching project by token:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Send project access email
router.post('/email/send-project-access', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { to, projectName, accessToken, portalUrl } = req.body;
    
    if (!to || !projectName || !accessToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Here you would integrate with your email service
    // For now, we'll just simulate it
    console.log('Sending project access email:', {
      to,
      subject: `Access Your Project: ${projectName}`,
      body: `
        Your project is ready to view!
        
        Project: ${projectName}
        
        Access Methods:
        
        1. Squarespace Auto-Login:
           - Log into your Squarespace account with: ${to}
           - The project workspace will automatically detect your account
        
        2. Direct Access Token:
           - Use this code: ${accessToken}
           - No Squarespace login required
        
        3. Direct Link:
           ${portalUrl}
        
        Questions? Reply to this email or call us.
        
        - Pleasant Cove Design Team
      `
    });
    
    res.json({ success: true, message: 'Email sent successfully' });
    
  } catch (error) {
    console.error('Error sending project access email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
