import path from 'path';
import fs from 'fs/promises';

interface ScrapingJob {
  id: string;
  businessType: string;
  location: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  totalFound: number;
  primeProspects: number;
  errorMessage?: string;
}

interface ScrapedBusiness {
  id: number;
  business_name: string;
  business_type: string;
  address: string;
  location: string;
  phone: string;
  website: string;
  has_website: boolean;
  rating: number;
  reviews: string;
  maps_url: string;
  scraped_at: string;
  search_session_id: string;
  data_source?: string;
}

class ScraperService {
  private jobs: Map<string, ScrapingJob> = new Map();
  private scraperDbPath: string;

  constructor() {
    // Compute paths relative to the built server (works in Docker/Railway)
    const DIST_DIR = __dirname; // .../pleasantcovedesign/server/dist
    const APP_DIR = path.resolve(DIST_DIR, ".."); // .../pleasantcovedesign/server
    const ROOT_DIR = path.resolve(APP_DIR, ".."); // .../pleasantcovedesign
    
    // Use a DB file at repo root so Python & Node agree on one location
    this.scraperDbPath = path.join(ROOT_DIR, "..", "scraper_results.db");
  }

  async startScraping(businessType: string, location: string): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ScrapingJob = {
      id: jobId,
      businessType,
      location,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      totalFound: 0,
      primeProspects: 0
    };

    this.jobs.set(jobId, job);

    // Start scraping in background
    this.runScraper(jobId, businessType, location).catch(error => {
      console.error(`Scraping job ${jobId} failed:`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.errorMessage = error.message;
        failedJob.completedAt = new Date();
      }
    });

    return jobId;
  }

  private async runScraper(jobId: string, businessType: string, location: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.progress = 10;

      // Check if we should use the real Python scraper
      const useRealScraper = process.env.USE_REAL_SCRAPER === 'true';
      const limit = Number(process.env.SCRAPE_LIMIT || 50);
      
      if (useRealScraper && process.env.GOOGLE_MAPS_API_KEY) {
        console.log(`🐍 [REAL SCRAPER] Running Python scraper for ${businessType} in ${location}`);
        
        // Use Python scraper
        const { spawn } = await import('child_process');
        const pythonScriptPath = path.join(__dirname, '../../scrapers/real_business_scraper_clean.py');
        
        job.progress = 20;
        
        const pythonProcess = spawn('python3', [
          pythonScriptPath,
          '--type', businessType,
          '--location', location,
          '--limit', String(limit),
          '--api-key', process.env.GOOGLE_MAPS_API_KEY
        ], {
          env: { ...process.env }
        });
        
        job.progress = 40;
        
        // Collect output from Python script
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
          // Update progress based on output
          if (output.includes('Fetching')) job.progress = 50;
          if (output.includes('Processing')) job.progress = 70;
          if (output.includes('Saving')) job.progress = 90;
        });
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(`Python stderr: ${data}`);
        });
        
        await new Promise<void>((resolve, reject) => {
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
            }
          });
        });
        
        job.progress = 95;
        
        // Parse results from Python output or read from DB
        // The Python script should save results to the database
        const results = await this.getScrapingResults();
        job.totalFound = results.length;
        job.primeProspects = Math.floor(job.totalFound * 0.3);
        job.progress = 100;
        job.status = 'completed';
        job.completedAt = new Date();
        
        console.log(`✅ [REAL SCRAPER] Job ${jobId} completed: ${job.totalFound} businesses found`);
        
      } else {
        // Fallback to Node.js scraper
        console.log(`🔍 [NODE SCRAPER] Running Node.js scraper for ${businessType} in ${location}`);
        
        const { startScrapeRun } = await import('./services/scrape-service');
        
        job.progress = 50;
        
        const result = await startScrapeRun({
          city: location,
          category: businessType,
          limit: limit
        });
        
        job.progress = 80;

        if (result.status === 'completed') {
          job.totalFound = Number(result.leadsFound) || 0;
          job.primeProspects = Math.floor(job.totalFound * 0.3); // Estimate 30% are prime prospects
          job.progress = 100;
          job.status = 'completed';
          job.completedAt = new Date();
          
          console.log(`✅ [NODE SCRAPER] Job ${jobId} completed: ${job.totalFound} businesses found`);
        } else {
          throw new Error(result.error || 'Scraping failed');
        }
      }

    } catch (error) {
      console.error(`❌ Scraping job ${jobId} failed:`, error);
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
    }
  }

  async getJobStatus(jobId: string): Promise<ScrapingJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async getAllJobs(): Promise<ScrapingJob[]> {
    return Array.from(this.jobs.values());
  }

  async getScrapingResults(sessionId?: string): Promise<ScrapedBusiness[]> {
    try {
      // Get leads from PostgreSQL database instead of SQLite
      const { storage } = await import('./storage');
      
      const leads = await storage.query(`
        SELECT 
          id,
          name as business_name,
          category as business_type,
          address_raw as address,
          city as location,
          phone_raw as phone,
          website_url as website,
          CASE WHEN website_status = 'HAS_SITE' THEN true ELSE false END as has_website,
          4.2 as rating,
          '15 reviews' as reviews,
          'https://maps.google.com' as maps_url,
          created_at as scraped_at,
          'scraper' as search_session_id,
          source as data_source
        FROM leads 
        WHERE source = 'scraper'
        ORDER BY created_at DESC
        LIMIT 100
      `);
      
      return leads.rows || [];
    } catch (error) {
      console.error('Error fetching scraping results from PostgreSQL:', error);
      return [];
    }
  }

  async getScrapingStats(): Promise<{
    totalBusinesses: number;
    businessesByType: Record<string, number>;
    primeProspects: number;
    averageRating: number;
    lastScrapedAt: string;
  }> {
    try {
      const { storage } = await import('./storage');
      
      // Get total businesses from scraper
      const totalResult = await storage.query(`
        SELECT COUNT(*) as count FROM leads WHERE source = 'scraper'
      `);
      const totalBusinesses = totalResult.rows[0]?.count || 0;
      
      // Get businesses by type
      const typeResult = await storage.query(`
        SELECT category, COUNT(*) as count 
        FROM leads 
        WHERE source = 'scraper' 
        GROUP BY category
      `);
      const businessesByType: Record<string, number> = {};
      typeResult.rows.forEach((row: any) => {
        businessesByType[row.category] = row.count;
      });
      
      // Get prime prospects (no website but has phone)
      const primeResult = await storage.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE source = 'scraper' 
        AND website_status = 'NO_SITE' 
        AND phone_raw IS NOT NULL 
        AND phone_raw != ''
      `);
      const primeProspects = primeResult.rows[0]?.count || 0;
      
      // Get last scraped date
      const lastResult = await storage.query(`
        SELECT MAX(created_at) as last_scraped 
        FROM leads 
        WHERE source = 'scraper'
      `);
      const lastScrapedAt = lastResult.rows[0]?.last_scraped || 'Never';
      
      return {
        totalBusinesses: Number(totalBusinesses),
        businessesByType,
        primeProspects: Number(primeProspects),
        averageRating: 4.2, // Default rating
        lastScrapedAt: lastScrapedAt === 'Never' ? 'Never' : new Date(lastScrapedAt).toLocaleString()
      };
    } catch (error) {
      console.error('Error fetching scraping stats from PostgreSQL:', error);
      return {
        totalBusinesses: 0,
        businessesByType: {},
        primeProspects: 0,
        averageRating: 0,
        lastScrapedAt: 'Never'
      };
    }
  }

  async exportLeads(format: 'excel' | 'csv' = 'excel'): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `leads_export_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    
    try {
      // Get leads data from PostgreSQL
      const { storage } = await import('./storage');
      const leads = await storage.query(`
        SELECT 
          name,
          category,
          phone_raw as phone,
          address_raw as address,
          city,
          website_url as website,
          website_status,
          created_at
        FROM leads 
        WHERE source = 'scraper'
        ORDER BY created_at DESC
      `);
      
      // For now, just return the filename - actual file generation would require additional libraries
      console.log(`📋 Export prepared: ${leads.rows.length} leads ready for ${format} export`);
      return filename;
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const scraperService = new ScraperService();
