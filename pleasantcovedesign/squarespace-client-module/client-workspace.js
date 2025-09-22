/**
 * Pleasant Cove Design - Client Project Workspace Module
 * Embeddable module for Squarespace sites to give clients access to their project
 */

(function() {
  'use strict';

  // Configuration
  const API_URL = 'https://api.pleasantcovedesign.com'; // Change to your API
  const WS_URL = 'wss://api.pleasantcovedesign.com';   // WebSocket URL

  // Module styles
  const styles = `
    <style>
      .pcd-workspace {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
      }

      .pcd-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 12px 12px 0 0;
        margin: -20px -20px 20px -20px;
      }

      .pcd-tabs {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        border-bottom: 2px solid #e2e8f0;
      }

      .pcd-tab {
        padding: 12px 24px;
        background: none;
        border: none;
        color: #64748b;
        font-size: 16px;
        cursor: pointer;
        position: relative;
        transition: all 0.3s;
      }

      .pcd-tab.active {
        color: #667eea;
      }

      .pcd-tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: #667eea;
      }

      .pcd-progress {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .pcd-progress-bar {
        width: 100%;
        height: 20px;
        background: #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 10px;
      }

      .pcd-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.5s ease;
      }

      .pcd-messages {
        background: white;
        padding: 20px;
        border-radius: 8px;
        height: 400px;
        display: flex;
        flex-direction: column;
      }

      .pcd-messages-list {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 20px;
      }

      .pcd-message {
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        max-width: 70%;
      }

      .pcd-message.client {
        background: #667eea;
        color: white;
        margin-left: auto;
      }

      .pcd-message.team {
        background: #f1f3f5;
        color: #1f2937;
      }

      .pcd-message-input {
        display: flex;
        gap: 10px;
      }

      .pcd-message-input input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
      }

      .pcd-send-btn {
        padding: 10px 20px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
      }

      .pcd-send-btn:hover {
        background: #5a5ed8;
      }

      .pcd-design-canvas {
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-height: 500px;
        position: relative;
      }

      .pcd-design-image {
        max-width: 100%;
        cursor: pointer;
      }

      .pcd-feedback-pin {
        position: absolute;
        width: 30px;
        height: 30px;
        background: #667eea;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
      }

      .pcd-milestones {
        background: white;
        padding: 20px;
        border-radius: 8px;
      }

      .pcd-milestone {
        display: flex;
        align-items: center;
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }

      .pcd-milestone.completed {
        background: #f0fdf4;
        border-color: #86efac;
      }

      .pcd-files {
        background: white;
        padding: 20px;
        border-radius: 8px;
      }

      .pcd-file {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 10px;
      }

      .pcd-loading {
        text-align: center;
        padding: 40px;
      }

      .pcd-error {
        background: #fee;
        color: #c00;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }
    </style>
  `;

  // Module HTML template
  const template = `
    <div class="pcd-workspace">
      <div class="pcd-header">
        <h2 id="pcd-project-name">Loading Project...</h2>
        <p id="pcd-company-name"></p>
      </div>

      <div class="pcd-tabs">
        <button class="pcd-tab active" data-tab="overview">Overview</button>
        <button class="pcd-tab" data-tab="designs">Designs</button>
        <button class="pcd-tab" data-tab="messages">Messages</button>
        <button class="pcd-tab" data-tab="milestones">Milestones</button>
        <button class="pcd-tab" data-tab="files">Files</button>
      </div>

      <div id="pcd-content">
        <div class="pcd-loading">Loading your project...</div>
      </div>
    </div>
  `;

  // Tab content generators
  const tabContent = {
    overview: (project) => `
      <div class="pcd-progress">
        <h3>Project Progress</h3>
        <div class="pcd-progress-bar">
          <div class="pcd-progress-fill" style="width: ${project.progress}%"></div>
        </div>
        <p>${project.progress}% Complete</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="pcd-progress">
          <h4>Current Stage</h4>
          <p>${project.currentStage || 'Design'}</p>
        </div>
        <div class="pcd-progress">
          <h4>Estimated Completion</h4>
          <p>${new Date(project.estimatedCompletion || project.dueDate).toLocaleDateString()}</p>
        </div>
      </div>
    `,
    
    designs: (project) => `
      <div class="pcd-design-canvas">
        <h3>Project Designs</h3>
        <p>Click on any design to leave feedback</p>
        <div id="pcd-designs-list">
          ${project.designs ? project.designs.map(design => `
            <div class="pcd-design-item" style="margin-bottom: 20px;">
              <h4>${design.name}</h4>
              <img src="${design.url}" class="pcd-design-image" data-design-id="${design.id}" />
            </div>
          `).join('') : '<p>No designs uploaded yet</p>'}
        </div>
      </div>
    `,
    
    messages: (project) => `
      <div class="pcd-messages">
        <div class="pcd-messages-list" id="pcd-messages-list">
          ${project.messages ? project.messages.map(msg => `
            <div class="pcd-message ${msg.sender}">
              <strong>${msg.senderName || msg.sender}</strong><br>
              ${msg.content}
            </div>
          `).join('') : '<p>No messages yet</p>'}
        </div>
        <div class="pcd-message-input">
          <input type="text" id="pcd-message-text" placeholder="Type your message..." />
          <button class="pcd-send-btn" onclick="PCD.sendMessage()">Send</button>
        </div>
      </div>
    `,
    
    milestones: (project) => `
      <div class="pcd-milestones">
        <h3>Project Milestones</h3>
        ${project.milestones ? project.milestones.map(milestone => `
          <div class="pcd-milestone ${milestone.status === 'completed' ? 'completed' : ''}">
            <div style="flex: 1;">
              <h4>${milestone.title}</h4>
              <p>${milestone.description}</p>
            </div>
            <div>
              ${milestone.status === 'completed' ? '✓ Complete' : 'In Progress'}
            </div>
          </div>
        `).join('') : '<p>No milestones set</p>'}
      </div>
    `,
    
    files: (project) => `
      <div class="pcd-files">
        <h3>Project Files</h3>
        ${project.files ? project.files.map(file => `
          <div class="pcd-file">
            <div>
              <strong>${file.name}</strong><br>
              <small>${new Date(file.uploadedAt).toLocaleDateString()}</small>
            </div>
            <a href="${file.url}" download class="pcd-send-btn">Download</a>
          </div>
        `).join('') : '<p>No files uploaded yet</p>'}
      </div>
    `
  };

  // Main module object
  window.PCD = {
    socket: null,
    project: null,
    memberInfo: null,

    // Initialize the module
    init: function() {
      // Insert styles and template
      document.head.insertAdjacentHTML('beforeend', styles);
      const container = document.getElementById('pleasant-cove-workspace');
      if (!container) {
        console.error('Pleasant Cove: Container not found');
        return;
      }
      container.innerHTML = template;

      // Detect member
      this.detectMember();
      
      // Set up event listeners
      this.setupEventListeners();
    },

    // Detect Squarespace member
    detectMember: function() {
      // Try to get member info from Squarespace
      let memberInfo = null;

      // Method 1: Check SQUARESPACE_CONTEXT
      if (window.Static && window.Static.SQUARESPACE_CONTEXT && window.Static.SQUARESPACE_CONTEXT.authenticatedAccount) {
        const account = window.Static.SQUARESPACE_CONTEXT.authenticatedAccount;
        memberInfo = {
          id: account.id,
          email: account.email,
          name: `${account.firstName} ${account.lastName}`
        };
      }

      // Method 2: Check URL parameters (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('member_email')) {
        memberInfo = {
          email: urlParams.get('member_email'),
          id: urlParams.get('member_id') || 'test-member'
        };
      }

      this.memberInfo = memberInfo;
      
      if (memberInfo) {
        this.loadProject();
      } else {
        this.showError('Please log in to view your project');
      }
    },

    // Load project data
    loadProject: function() {
      fetch(`${API_URL}/api/workspace/member/${this.memberInfo.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.project) {
            this.project = data.project;
            this.updateUI();
            this.connectWebSocket();
          } else {
            this.showError('No active project found');
          }
        })
        .catch(err => {
          console.error('Error loading project:', err);
          this.showError('Failed to load project');
        });
    },

    // Connect WebSocket for real-time updates
    connectWebSocket: function() {
      this.socket = io(WS_URL, {
        query: {
          projectId: this.project.id,
          memberEmail: this.memberInfo.email
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to Pleasant Cove');
      });

      this.socket.on('message:new', (message) => {
        this.addMessage(message);
      });

      this.socket.on('project:updated', (update) => {
        Object.assign(this.project, update);
        this.updateUI();
      });
    },

    // Update UI with project data
    updateUI: function() {
      document.getElementById('pcd-project-name').textContent = this.project.name;
      document.getElementById('pcd-company-name').textContent = this.project.companyName;
      this.showTab('overview');
    },

    // Show specific tab
    showTab: function(tabName) {
      // Update active tab
      document.querySelectorAll('.pcd-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });

      // Update content
      const content = tabContent[tabName](this.project);
      document.getElementById('pcd-content').innerHTML = content;
    },

    // Send message
    sendMessage: function() {
      const input = document.getElementById('pcd-message-text');
      const message = input.value.trim();
      
      if (!message) return;

      const messageData = {
        projectId: this.project.id,
        memberId: this.memberInfo.id,
        memberEmail: this.memberInfo.email,
        memberName: this.memberInfo.name || this.memberInfo.email,
        content: message
      };

      fetch(`${API_URL}/api/workspace/project/${this.project.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          input.value = '';
          // Message will appear via WebSocket
        }
      });
    },

    // Add message to UI
    addMessage: function(message) {
      const messagesList = document.getElementById('pcd-messages-list');
      if (!messagesList) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = `pcd-message ${message.sender === this.memberInfo.email ? 'client' : 'team'}`;
      msgDiv.innerHTML = `<strong>${message.senderName || message.sender}</strong><br>${message.content}`;
      
      messagesList.appendChild(msgDiv);
      messagesList.scrollTop = messagesList.scrollHeight;
    },

    // Set up event listeners
    setupEventListeners: function() {
      document.addEventListener('click', (e) => {
        // Tab clicks
        if (e.target.classList.contains('pcd-tab')) {
          this.showTab(e.target.dataset.tab);
        }

        // Design clicks for feedback
        if (e.target.classList.contains('pcd-design-image')) {
          this.addFeedbackPin(e);
        }
      });

      // Enter key in message input
      document.addEventListener('keypress', (e) => {
        if (e.target.id === 'pcd-message-text' && e.key === 'Enter') {
          this.sendMessage();
        }
      });
    },

    // Show error message
    showError: function(message) {
      document.getElementById('pcd-content').innerHTML = `
        <div class="pcd-error">${message}</div>
      `;
    },

    // Add feedback pin to design
    addFeedbackPin: function(e) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const feedback = prompt('Add your feedback for this design:');
      if (feedback) {
        // Send feedback to server
        fetch(`${API_URL}/api/workspace/project/${this.project.id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: this.memberInfo.id,
            designId: e.target.dataset.designId,
            x: x,
            y: y,
            content: feedback
          })
        });
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      PCD.init();
    });
  } else {
    PCD.init();
  }
})();
