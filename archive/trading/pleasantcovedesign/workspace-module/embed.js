/**
 * Pleasant Cove Design - Project Workspace Embed Loader
 * This script auto-loads the project workspace module for Squarespace sites
 */

(function() {
    'use strict';
    
    // Configuration
    const BASE_URL = document.currentScript.dataset.api || 'https://api.pleasantcovedesign.com';
    const CDN_URL = document.currentScript.dataset.cdn || 'https://pleasantcovedesign.com/workspace';
    const VERSION = '1.0.0';
    
    // Helper functions
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };
    
    const detectSquarespaceMember = () => {
        // Method 1: Check SQUARESPACE_CONTEXT
        if (window.Static?.SQUARESPACE_CONTEXT?.authenticatedAccount) {
            const account = window.Static.SQUARESPACE_CONTEXT.authenticatedAccount;
            return {
                id: account.id,
                email: account.email,
                firstName: account.firstName,
                lastName: account.lastName,
                avatarUrl: account.avatarUrl
            };
        }
        
        // Method 2: Check SiteUserInfo cookie
        try {
            const siteUserInfo = getCookie('SiteUserInfo');
            if (siteUserInfo) {
                const decoded = decodeURIComponent(siteUserInfo);
                const parsed = JSON.parse(decoded);
                if (parsed.authenticated && parsed.id) {
                    return {
                        id: parsed.id,
                        email: parsed.email || 'Member',
                        firstName: parsed.firstName,
                        lastName: parsed.lastName
                    };
                }
            }
        } catch (e) {}
        
        // Method 3: Check member area context
        const memberAreaScript = document.querySelector('script[data-member-area-script]');
        if (memberAreaScript) {
            const memberId = memberAreaScript.dataset.memberId;
            const memberEmail = memberAreaScript.dataset.memberEmail;
            if (memberId) {
                return {
                    id: memberId,
                    email: memberEmail || 'Member'
                };
            }
        }
        
        // Method 4: Check data attributes
        const memberElement = document.querySelector('[data-member-id]');
        if (memberElement) {
            return {
                id: memberElement.dataset.memberId,
                email: memberElement.dataset.memberEmail || 'Member'
            };
        }
        
        return null;
    };
    
    // Resource loader
    const loadResource = (type, url) => {
        return new Promise((resolve, reject) => {
            let element;
            
            if (type === 'script') {
                element = document.createElement('script');
                element.src = url;
                element.async = true;
            } else if (type === 'style') {
                element = document.createElement('link');
                element.rel = 'stylesheet';
                element.href = url;
            }
            
            element.onload = resolve;
            element.onerror = reject;
            
            if (type === 'script') {
                document.body.appendChild(element);
            } else {
                document.head.appendChild(element);
            }
        });
    };
    
    // Initialize workspace
    const initWorkspace = async () => {
        const container = document.getElementById('pleasant-cove-workspace');
        if (!container) {
            console.error('Pleasant Cove Workspace: Container element not found');
            return;
        }
        
        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: pcd-spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #6b7280;">Loading your project workspace...</p>
            </div>
            <style>
                @keyframes pcd-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        try {
            // Load dependencies
            await loadResource('style', `${CDN_URL}/workspace.css?v=${VERSION}`);
            await loadResource('script', 'https://cdn.socket.io/4.5.4/socket.io.min.js');
            await loadResource('script', `${CDN_URL}/workspace.js?v=${VERSION}`);
            
            // Detect member
            const member = detectSquarespaceMember();
            
            // Initialize workspace
            if (window.PleasantCoveWorkspace) {
                window.PleasantCoveWorkspace.init({
                    container: 'pleasant-cove-workspace',
                    apiUrl: BASE_URL,
                    cdnUrl: CDN_URL,
                    member: member,
                    version: VERSION
                });
            } else {
                throw new Error('Workspace module failed to load');
            }
            
        } catch (error) {
            console.error('Pleasant Cove Workspace: Failed to initialize', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ef4444;">
                    <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Unable to load workspace</p>
                    <p style="color: #6b7280;">Please refresh the page or contact support.</p>
                </div>
            `;
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkspace);
    } else {
        initWorkspace();
    }
    
    // Expose version for debugging
    window.PleasantCoveWorkspaceVersion = VERSION;
    
})();
