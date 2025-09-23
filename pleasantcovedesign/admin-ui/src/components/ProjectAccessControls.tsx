import React, { useState } from 'react';
import { Eye, Copy, Key, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import api from '../api';

interface ProjectAccessControlsProps {
  project: any;
  clientEmail?: string;
  onTokenGenerated?: () => void;
}

export default function ProjectAccessControls({ 
  project, 
  clientEmail,
  onTokenGenerated 
}: ProjectAccessControlsProps) {
  const [showCopied, setShowCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  
  const clientPortalUrl = project.accessToken 
    ? `${window.location.origin}/clientportal/${project.accessToken}`
    : null;
    
  const squarespaceInstructions = `
1. Client can log into Squarespace with: ${clientEmail || 'their email'}
2. The module will auto-detect their account
3. Or they can use the access token: ${project.accessToken || 'Generate token first'}
  `;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };
  
  const generateToken = async () => {
    if (!project.id) return;
    
    setGeneratingToken(true);
    try {
      const response = await api.post(`/projects/${project.id}/generate-token`);
      if (response.data.token) {
        project.accessToken = response.data.token;
        if (onTokenGenerated) onTokenGenerated();
        alert('Access token generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert('Failed to generate access token');
    } finally {
      setGeneratingToken(false);
    }
  };
  
  const sendAccessEmail = async () => {
    if (!clientEmail || !project.accessToken) {
      alert('Client email and access token required');
      return;
    }
    
    try {
      await api.post('/email/send-project-access', {
        to: clientEmail,
        projectName: project.name || project.title,
        accessToken: project.accessToken,
        portalUrl: clientPortalUrl
      });
      alert('Access instructions sent to client!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send access email');
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Client Access Management
        </h3>
        {showCopied && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Copied!
          </span>
        )}
      </div>
      
      {/* Client Email */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <p className="text-sm font-medium text-gray-700">Client Email</p>
          <p className="text-sm text-gray-600">{clientEmail || 'Not set'}</p>
        </div>
        {clientEmail && (
          <button
            onClick={() => copyToClipboard(clientEmail)}
            className="text-blue-600 hover:text-blue-700 p-2"
            title="Copy email"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Access Token */}
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Access Token</p>
          {project.accessToken ? (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              {project.accessToken}
            </code>
          ) : (
            <p className="text-sm text-gray-500">No token generated</p>
          )}
        </div>
        <div className="flex gap-2">
          {project.accessToken ? (
            <button
              onClick={() => copyToClipboard(project.accessToken)}
              className="text-blue-600 hover:text-blue-700 p-2"
              title="Copy token"
            >
              <Copy className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={generateToken}
              disabled={generatingToken}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generatingToken ? 'Generating...' : 'Generate Token'}
            </button>
          )}
        </div>
      </div>
      
      {/* Client Portal URL */}
      {project.accessToken && (
        <div className="py-3 border-b">
          <p className="text-sm font-medium text-gray-700 mb-2">Client Portal URL</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 px-3 py-2 rounded flex-1 overflow-x-auto">
              {clientPortalUrl}
            </code>
            <button
              onClick={() => copyToClipboard(clientPortalUrl)}
              className="text-blue-600 hover:text-blue-700 p-2 flex-shrink-0"
              title="Copy URL"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={clientPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 p-2 flex-shrink-0"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
      
      {/* Squarespace Instructions */}
      <div className="py-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Squarespace Access Methods</p>
        <div className="bg-white rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium">Method 1: Auto-detection (Recommended)</p>
          <ul className="list-disc list-inside text-gray-600 ml-2">
            <li>Client logs into Squarespace with: <strong>{clientEmail || 'their email'}</strong></li>
            <li>Module automatically detects their account</li>
            <li>Shows their project immediately</li>
          </ul>
          
          <p className="font-medium mt-3">Method 2: Access Token</p>
          <ul className="list-disc list-inside text-gray-600 ml-2">
            <li>Client enters token: <code className="bg-gray-100 px-1">{project.accessToken || '[Generate token]'}</code></li>
            <li>No Squarespace login required</li>
            <li>Direct access to project</li>
          </ul>
          
          <button
            onClick={() => copyToClipboard(squarespaceInstructions)}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            Copy Instructions
          </button>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {clientEmail && project.accessToken && (
          <button
            onClick={sendAccessEmail}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email Access Instructions
          </button>
        )}
        {project.accessToken && (
          <button
            onClick={() => window.open(clientPortalUrl, '_blank')}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Client View
          </button>
        )}
      </div>
    </div>
  );
}
