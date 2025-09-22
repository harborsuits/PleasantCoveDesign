/**
 * Pleasant Cove Design - Project Workspace Core Module
 * Provides complete project management interface for Squarespace members
 */

window.PleasantCoveWorkspace = (function() {
    'use strict';
    
    // Module state
    let config = null;
    let socket = null;
    let projectData = null;
    let memberContext = null;
    
    // UI state
    let activePanel = 'progress';
    let designElements = [];
    let feedback = [];
    let messages = [];
    let unreadMessages = 0;
    
    // API endpoints
    const API = {
        getMemberProject: (memberId) => `${config.apiUrl}/api/workspace/member/${memberId}`,
        getProjectData: (projectId) => `${config.apiUrl}/api/workspace/project/${projectId}`,
        getFeedback: (projectId, memberId) => `${config.apiUrl}/api/workspace/project/${projectId}/feedback?memberId=${memberId}`,
        postFeedback: (projectId) => `${config.apiUrl}/api/workspace/project/${projectId}/feedback`,
        getMessages: (projectId, memberId) => `${config.apiUrl}/api/workspace/project/${projectId}/messages?memberId=${memberId}`,
        postMessage: (projectId) => `${config.apiUrl}/api/workspace/project/${projectId}/messages`,
        getDesignElements: (projectId) => `${config.apiUrl}/api/workspace/project/${projectId}/design-elements`,
        uploadFile: () => `${config.apiUrl}/api/workspace/upload`
    };
    
    // Initialize module
    const init = async (configuration) => {
        config = configuration;
        
        // Check for member authentication
        if (!config.member) {
            showAuthPrompt();
            return;
        }
        
        // Load member's project
        try {
            const response = await fetch(API.getMemberProject(config.member.id));
            const data = await response.json();
            
            if (data.success && data.project) {
                projectData = data.project;
                memberContext = data.memberContext;
                await loadWorkspace();
            } else {
                showNoProject();
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            showError('Unable to load your project. Please try again later.');
        }
    };
    
    // Load workspace interface
    const loadWorkspace = async () => {
        const container = document.getElementById(config.container);
        container.innerHTML = getWorkspaceHTML();
        
        // Initialize components
        attachEventListeners();
        initializeWebSocket();
        
        // Load initial data
        await Promise.all([
            loadFeedback(),
            loadMessages(),
            loadDesignElements()
        ]);
        
        // Update UI
        updateProgressChart();
        updateCounts();
    };
    
    // WebSocket connection
    const initializeWebSocket = () => {
        const wsUrl = config.apiUrl.replace('http', 'ws');
        socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            query: {
                projectToken: projectData.token,
                memberId: config.member.id,
                memberEmail: config.member.email
            }
        });
        
        socket.on('connect', () => {
            console.log('Connected to project workspace');
        });
        
        socket.on('project:update', handleProjectUpdate);
        socket.on('feedback:new', handleNewFeedback);
        socket.on('feedback:response', handleFeedbackResponse);
        socket.on('message:new', handleNewMessage);
        socket.on('design:update', handleDesignUpdate);
        
        socket.on('disconnect', () => {
            console.log('Disconnected from project workspace');
        });
    };
    
    // Event handlers
    const attachEventListeners = () => {
        // Panel switches
        document.querySelectorAll('[data-panel]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                switchPanel(e.target.dataset.panel);
            });
        });
        
        // Feedback form
        const feedbackForm = document.getElementById('pcd-feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', handleFeedbackSubmit);
        }
        
        // Message form
        const messageForm = document.getElementById('pcd-message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', handleMessageSubmit);
        }
        
        // File upload
        const fileInput = document.getElementById('pcd-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
        
        // Design canvas clicks
        const canvas = document.getElementById('pcd-design-canvas');
        if (canvas) {
            canvas.addEventListener('click', handleCanvasClick);
        }
    };
    
    // Load feedback
    const loadFeedback = async () => {
        try {
            const response = await fetch(API.getFeedback(projectData.id, config.member.id));
            const data = await response.json();
            
            if (data.success) {
                feedback = data.feedback;
                renderFeedback();
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        }
    };
    
    // Load messages
    const loadMessages = async () => {
        try {
            const response = await fetch(API.getMessages(projectData.id, config.member.id));
            const data = await response.json();
            
            if (data.success) {
                messages = data.messages;
                unreadMessages = data.unreadCount || 0;
                renderMessages();
                updateCounts();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };
    
    // Load design elements
    const loadDesignElements = async () => {
        try {
            const response = await fetch(API.getDesignElements(projectData.id));
            const data = await response.json();
            
            if (data.success) {
                designElements = data.elements;
                renderDesignCanvas();
            }
        } catch (error) {
            console.error('Failed to load design elements:', error);
        }
    };
    
    // Handle feedback submission
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const subject = form.subject.value;
        const content = form.content.value;
        const stage = form.stage?.value || projectData.currentStage;
        
        if (!subject || !content) return;
        
        try {
            const response = await fetch(API.postFeedback(projectData.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memberId: config.member.id,
                    memberEmail: config.member.email,
                    subject,
                    content,
                    stage,
                    elementId: null // Set if from canvas click
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                form.reset();
                showNotification('Feedback submitted successfully!');
                
                // Add to local list
                feedback.unshift(data.feedback);
                renderFeedback();
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            showNotification('Failed to submit feedback. Please try again.', 'error');
        }
    };
    
    // Handle message submission
    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const content = form.message.value;
        
        if (!content.trim()) return;
        
        try {
            const response = await fetch(API.postMessage(projectData.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memberId: config.member.id,
                    memberEmail: config.member.email,
                    memberName: `${config.member.firstName || ''} ${config.member.lastName || ''}`.trim() || 'Member',
                    content,
                    senderType: 'client'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                form.reset();
                
                // Add to local list
                messages.push(data.message);
                renderMessages();
                
                // Scroll to bottom
                const container = document.getElementById('pcd-messages-container');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification('Failed to send message. Please try again.', 'error');
        }
    };
    
    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectData.id);
        formData.append('memberId', config.member.id);
        
        try {
            const response = await fetch(API.uploadFile(), {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('File uploaded successfully!');
                // Handle file reference in message/feedback
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            showNotification('Failed to upload file. Please try again.', 'error');
        }
    };
    
    // Handle canvas clicks for feedback
    const handleCanvasClick = (e) => {
        if (e.target.classList.contains('pcd-design-element')) {
            const elementId = e.target.dataset.elementId;
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Show feedback form for this element
            showElementFeedback(elementId, { x, y });
        }
    };
    
    // Real-time updates
    const handleProjectUpdate = (data) => {
        if (data.projectId === projectData.id) {
            projectData = { ...projectData, ...data.updates };
            updateProgressChart();
        }
    };
    
    const handleNewFeedback = (data) => {
        if (data.projectId === projectData.id) {
            feedback.unshift(data);
            renderFeedback();
            showNotification('New feedback added!');
        }
    };
    
    const handleFeedbackResponse = (data) => {
        const index = feedback.findIndex(f => f.id === data.feedbackId);
        if (index !== -1) {
            feedback[index].responses = feedback[index].responses || [];
            feedback[index].responses.push(data.response);
            renderFeedback();
            showNotification('New response to your feedback!');
        }
    };
    
    const handleNewMessage = (data) => {
        if (data.projectId === projectData.id && 
            (data.memberId === config.member.id || data.senderType === 'admin')) {
            messages.push(data);
            renderMessages();
            
            if (activePanel !== 'messages' && data.senderType === 'admin') {
                unreadMessages++;
                updateCounts();
                showNotification('New message from Pleasant Cove Design!');
            }
        }
    };
    
    const handleDesignUpdate = (data) => {
        if (data.projectId === projectData.id) {
            loadDesignElements();
            showNotification('Design updated!');
        }
    };
    
    // UI rendering functions
    const getWorkspaceHTML = () => {
        return `
            <div class="pcd-workspace">
                <header class="pcd-header">
                    <div class="pcd-header-content">
                        <h1>${projectData.name}</h1>
                        <p>Welcome, ${config.member.firstName || config.member.email}</p>
                    </div>
                </header>
                
                <div class="pcd-progress-section">
                    <h2>Project Progress</h2>
                    <div id="pcd-progress-chart" class="pcd-progress-chart"></div>
                </div>
                
                <div class="pcd-tabs">
                    <button class="pcd-tab active" data-panel="progress">Overview</button>
                    <button class="pcd-tab" data-panel="design">Design</button>
                    <button class="pcd-tab" data-panel="feedback">
                        Feedback <span id="pcd-feedback-count" class="pcd-badge"></span>
                    </button>
                    <button class="pcd-tab" data-panel="messages">
                        Messages <span id="pcd-message-count" class="pcd-badge"></span>
                    </button>
                    <button class="pcd-tab" data-panel="files">Files</button>
                </div>
                
                <div class="pcd-panels">
                    <div id="pcd-panel-progress" class="pcd-panel active">
                        ${getProgressPanelHTML()}
                    </div>
                    <div id="pcd-panel-design" class="pcd-panel">
                        <div id="pcd-design-canvas" class="pcd-design-canvas"></div>
                    </div>
                    <div id="pcd-panel-feedback" class="pcd-panel">
                        ${getFeedbackPanelHTML()}
                    </div>
                    <div id="pcd-panel-messages" class="pcd-panel">
                        ${getMessagesPanelHTML()}
                    </div>
                    <div id="pcd-panel-files" class="pcd-panel">
                        ${getFilesPanelHTML()}
                    </div>
                </div>
            </div>
        `;
    };
    
    const getProgressPanelHTML = () => {
        return `
            <div class="pcd-progress-overview">
                <h3>Current Stage: ${projectData.currentStage}</h3>
                <p>Your website is currently in the ${projectData.currentStage} phase.</p>
                
                <div class="pcd-next-steps">
                    <h4>Next Steps:</h4>
                    <ul>
                        ${getNextSteps().map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="pcd-timeline">
                    <h4>Estimated Timeline:</h4>
                    <p>Expected completion: ${formatDate(projectData.estimatedCompletion)}</p>
                </div>
            </div>
        `;
    };
    
    const getFeedbackPanelHTML = () => {
        return `
            <div class="pcd-feedback-section">
                <form id="pcd-feedback-form" class="pcd-feedback-form">
                    <input type="text" name="subject" placeholder="Subject" required>
                    <textarea name="content" placeholder="Your feedback..." required></textarea>
                    <button type="submit">Submit Feedback</button>
                </form>
                
                <div id="pcd-feedback-list" class="pcd-feedback-list"></div>
            </div>
        `;
    };
    
    const getMessagesPanelHTML = () => {
        return `
            <div class="pcd-messages-section">
                <div id="pcd-messages-container" class="pcd-messages-container"></div>
                
                <form id="pcd-message-form" class="pcd-message-form">
                    <input type="text" name="message" placeholder="Type a message..." required>
                    <button type="submit">Send</button>
                </form>
            </div>
        `;
    };
    
    const getFilesPanelHTML = () => {
        return `
            <div class="pcd-files-section">
                <div class="pcd-file-upload">
                    <input type="file" id="pcd-file-input" multiple>
                    <label for="pcd-file-input">Upload Files</label>
                </div>
                
                <div id="pcd-files-list" class="pcd-files-list">
                    <p>No files uploaded yet.</p>
                </div>
            </div>
        `;
    };
    
    // Helper functions
    const switchPanel = (panel) => {
        activePanel = panel;
        
        // Update tabs
        document.querySelectorAll('.pcd-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panel);
        });
        
        // Update panels
        document.querySelectorAll('.pcd-panel').forEach(p => {
            p.classList.toggle('active', p.id === `pcd-panel-${panel}`);
        });
        
        // Clear unread counts
        if (panel === 'messages') {
            unreadMessages = 0;
            updateCounts();
        }
    };
    
    const updateCounts = () => {
        // Update feedback count
        const feedbackCount = feedback.filter(f => !f.read).length;
        const feedbackBadge = document.getElementById('pcd-feedback-count');
        if (feedbackBadge) {
            feedbackBadge.textContent = feedbackCount || '';
            feedbackBadge.style.display = feedbackCount ? 'inline' : 'none';
        }
        
        // Update message count
        const messageBadge = document.getElementById('pcd-message-count');
        if (messageBadge) {
            messageBadge.textContent = unreadMessages || '';
            messageBadge.style.display = unreadMessages ? 'inline' : 'none';
        }
    };
    
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `pcd-notification pcd-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    const showAuthPrompt = () => {
        const container = document.getElementById(config.container);
        container.innerHTML = `
            <div class="pcd-auth-prompt">
                <h2>Please Log In</h2>
                <p>You need to be logged into your Squarespace account to view your project workspace.</p>
                <a href="/account/login" class="pcd-login-button">Log In</a>
            </div>
        `;
    };
    
    const showNoProject = () => {
        const container = document.getElementById(config.container);
        container.innerHTML = `
            <div class="pcd-no-project">
                <h2>No Active Project</h2>
                <p>You don't have any active projects at this time.</p>
                <p>If you believe this is an error, please contact support@pleasantcovedesign.com</p>
            </div>
        `;
    };
    
    const showError = (message) => {
        const container = document.getElementById(config.container);
        container.innerHTML = `
            <div class="pcd-error">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    };
    
    // Utility functions
    const formatDate = (date) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    const getNextSteps = () => {
        const steps = {
            'Discovery': [
                'Complete initial consultation',
                'Review project requirements',
                'Approve sitemap and features'
            ],
            'Design': [
                'Review design mockups',
                'Provide feedback on layouts',
                'Approve final design'
            ],
            'Development': [
                'Monitor development progress',
                'Test functionality',
                'Provide content and images'
            ],
            'Testing': [
                'Test all features',
                'Report any issues',
                'Approve for launch'
            ],
            'Launch': [
                'Final review',
                'DNS configuration',
                'Go live!'
            ]
        };
        
        return steps[projectData.currentStage] || ['Contact support for next steps'];
    };
    
    // Render functions
    const renderFeedback = () => {
        const container = document.getElementById('pcd-feedback-list');
        if (!container) return;
        
        container.innerHTML = feedback.map(item => `
            <div class="pcd-feedback-item">
                <h4>${item.subject}</h4>
                <p>${item.content}</p>
                <div class="pcd-feedback-meta">
                    <span>${formatDate(item.createdAt)}</span>
                    <span>${item.stage}</span>
                </div>
                ${item.responses ? item.responses.map(r => `
                    <div class="pcd-feedback-response">
                        <p>${r.content}</p>
                        <span>${formatDate(r.createdAt)}</span>
                    </div>
                `).join('') : ''}
            </div>
        `).join('');
    };
    
    const renderMessages = () => {
        const container = document.getElementById('pcd-messages-container');
        if (!container) return;
        
        container.innerHTML = messages.map(msg => `
            <div class="pcd-message pcd-message-${msg.senderType}">
                <div class="pcd-message-content">${msg.content}</div>
                <div class="pcd-message-meta">
                    <span>${msg.senderType === 'admin' ? 'Pleasant Cove Design' : 'You'}</span>
                    <span>${formatDate(msg.createdAt)}</span>
                </div>
            </div>
        `).join('');
    };
    
    const renderDesignCanvas = () => {
        const canvas = document.getElementById('pcd-design-canvas');
        if (!canvas) return;
        
        canvas.innerHTML = designElements.map(element => `
            <div class="pcd-design-element" 
                 data-element-id="${element.id}"
                 style="left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px;">
                <img src="${element.imageUrl}" alt="${element.name}">
                ${element.feedbackCount ? `<span class="pcd-feedback-indicator">${element.feedbackCount}</span>` : ''}
            </div>
        `).join('');
    };
    
    const updateProgressChart = () => {
        const chart = document.getElementById('pcd-progress-chart');
        if (!chart) return;
        
        const stages = ['Discovery', 'Design', 'Development', 'Testing', 'Launch'];
        const currentIndex = stages.indexOf(projectData.currentStage);
        
        chart.innerHTML = stages.map((stage, index) => `
            <div class="pcd-progress-stage ${index <= currentIndex ? 'complete' : ''} ${index === currentIndex ? 'current' : ''}">
                <div class="pcd-progress-icon">${index <= currentIndex ? '✓' : index + 1}</div>
                <div class="pcd-progress-label">${stage}</div>
            </div>
        `).join('<div class="pcd-progress-connector"></div>');
    };
    
    // Public API
    return {
        init,
        version: '1.0.0'
    };
    
})();
