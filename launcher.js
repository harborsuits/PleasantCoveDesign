#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PleasantCoveLauncher {
    constructor() {
        this.processes = new Map();
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    async checkService(url, name) {
        try {
            const response = await fetch(url, { timeout: 2000 });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async getSystemStatus() {
        const status = {
            backend: await this.checkService('http://localhost:3000/health', 'Backend'),
            ui: await this.checkService('http://localhost:5173', 'UI'),
            webhookTests: {
                acuity: false,
                squarespace: false
            }
        };

        // Check if webhook test files exist
        status.webhookTests.acuity = fs.existsSync(path.join(__dirname, 'archive', 'Pleasantcovedesign-main', 'test-acuity-webhook.js'));
        status.webhookTests.squarespace = fs.existsSync(path.join(__dirname, 'archive', 'Pleasantcovedesign-main', 'test-squarespace-webhook.js'));

        return status;
    }

    showHeader() {
        console.clear();
        console.log('\n🚀 Pleasant Cove Design Launcher');
        console.log('================================');
        console.log('✨ Complete CRM + Squarespace Integration System\n');
    }

    async showStatus() {
        const status = await this.getSystemStatus();

        console.log('📊 System Status:');
        console.log(`  🔧 Backend (Port 3000): ${status.backend ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`  🎨 UI (Port 5173): ${status.ui ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`  🪝 Webhook Tests: ${status.webhookTests.acuity && status.webhookTests.squarespace ? '🟢 Available' : '🟡 Missing'}`);
        console.log('');
    }

    showMenu() {
        console.log('🎯 Available Actions:');
        console.log('  1. Start Full System (Backend + UI)');
        console.log('  2. Start Backend Only');
        console.log('  3. Start UI Only');
        console.log('  4. Stop All Services');
        console.log('  5. Test Webhooks');
        console.log('  6. Open Admin Dashboard');
        console.log('  7. Open CRM Interface');
        console.log('  8. View Logs');
        console.log('  9. System Health Check');
        console.log('  0. Exit');
        console.log('');
    }

    async startBackend() {
        if (this.processes.has('backend')) {
            console.log('🔧 Backend is already running');
            return;
        }

        console.log('🚀 Starting Backend Server...');

        const backendProcess = spawn('npm', ['run', 'server'], {
            cwd: path.join(__dirname, 'archive', 'Pleasantcovedesign-main'),
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.processes.set('backend', backendProcess);

        // Wait for backend to start
        let attempts = 0;
        while (attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (await this.checkService('http://localhost:3000/health', 'Backend')) {
                console.log('✅ Backend started successfully on http://localhost:3000');
                break;
            }
            attempts++;
        }

        if (attempts >= 10) {
            console.log('❌ Backend failed to start');
        }
    }

    async startUI() {
        if (this.processes.has('ui')) {
            console.log('🎨 UI is already running');
            return;
        }

        console.log('🚀 Starting UI...');

        const uiProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'archive', 'lovable-ui-integration'),
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.processes.set('ui', uiProcess);

        // Wait for UI to start
        let attempts = 0;
        while (attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (await this.checkService('http://localhost:5173', 'UI')) {
                console.log('✅ UI started successfully on http://localhost:5173');
                break;
            }
            attempts++;
        }

        if (attempts >= 15) {
            console.log('❌ UI failed to start');
        }
    }

    async startFullSystem() {
        console.log('🎯 Starting Full System (Backend + UI)...');
        await this.startBackend();
        await this.startUI();

        // Open browsers after a short delay
        setTimeout(() => {
            this.openAdminDashboard();
            setTimeout(() => this.openCRMInterface(), 2000);
        }, 3000);
    }

    stopAllServices() {
        console.log('🛑 Stopping all services...');

        for (const [name, process] of this.processes) {
            try {
                process.kill();
                console.log(`✅ Stopped ${name}`);
            } catch (error) {
                console.log(`❌ Failed to stop ${name}:`, error.message);
            }
        }

        this.processes.clear();
        console.log('✅ All services stopped');
    }

    async testWebhooks() {
        console.log('🧪 Testing Webhooks...');

        const backendRunning = await this.checkService('http://localhost:3000/health', 'Backend');
        if (!backendRunning) {
            console.log('❌ Backend must be running for webhook tests');
            return;
        }

        // Test Acuity webhook
        try {
            console.log('📅 Testing Acuity webhook...');
            const acuityResponse = await fetch('http://localhost:3000/api/acuity-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 12345678,
                    firstName: 'Test',
                    lastName: 'User',
                    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    duration: 30,
                    type: 'Test Consultation',
                    calendarID: 1234,
                    location: 'Zoom',
                    notes: 'Webhook test',
                    email: 'test@example.com'
                })
            });

            if (acuityResponse.ok) {
                console.log('✅ Acuity webhook test PASSED');
            } else {
                console.log('❌ Acuity webhook test FAILED');
            }
        } catch (error) {
            console.log('❌ Acuity webhook test ERROR:', error.message);
        }

        // Test Squarespace webhook
        try {
            console.log('📝 Testing Squarespace webhook...');
            const squarespaceResponse = await fetch('http://localhost:3000/api/squarespace-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formName: "Contact",
                    pageUrl: "https://pleasantcovedesign.com/contact",
                    fields: [
                        { label: "Name", value: "Test User" },
                        { label: "Email", value: "test@example.com" },
                        { label: "Message", value: "Webhook test message" }
                    ]
                })
            });

            if (squarespaceResponse.ok) {
                console.log('✅ Squarespace webhook test PASSED');
            } else {
                console.log('❌ Squarespace webhook test FAILED');
            }
        } catch (error) {
            console.log('❌ Squarespace webhook test ERROR:', error.message);
        }
    }

    openAdminDashboard() {
        try {
            execSync('open "http://localhost:5173"');
            console.log('🌐 Opened Admin Dashboard in browser');
        } catch (error) {
            console.log('💡 To open manually: http://localhost:5173');
        }
    }

    openCRMInterface() {
        try {
            execSync('open "http://localhost:3000"');
            console.log('🌐 Opened CRM Interface in browser');
        } catch (error) {
            console.log('💡 To open manually: http://localhost:3000');
        }
    }

    viewLogs() {
        console.log('📋 Recent Logs:');

        const logFiles = [
            'archive/Pleasantcovedesign-main/dashboard.log',
            'archive/Pleasantcovedesign-main/server_monitor.log'
        ];

        for (const logFile of logFiles) {
            const logPath = path.join(__dirname, logFile);
            if (fs.existsSync(logPath)) {
                console.log(`\n📄 ${logFile}:`);
                try {
                    const logContent = fs.readFileSync(logPath, 'utf8');
                    const lines = logContent.split('\n').slice(-5); // Last 5 lines
                    lines.forEach(line => {
                        if (line.trim()) console.log(`  ${line}`);
                    });
                } catch (error) {
                    console.log(`  Error reading log: ${error.message}`);
                }
            }
        }
    }

    async healthCheck() {
        console.log('🏥 System Health Check:');
        console.log('');

        const checks = [
            { name: 'Backend API', url: 'http://localhost:3000/health' },
            { name: 'UI', url: 'http://localhost:5173' },
            { name: 'Webhook Tests', check: () => {
                const acuityExists = fs.existsSync(path.join(__dirname, 'archive', 'Pleasantcovedesign-main', 'test-acuity-webhook.js'));
                const squarespaceExists = fs.existsSync(path.join(__dirname, 'archive', 'Pleasantcovedesign-main', 'test-squarespace-webhook.js'));
                return acuityExists && squarespaceExists;
            }}
        ];

        for (const check of checks) {
            try {
                let status = false;
                if (check.url) {
                    status = await this.checkService(check.url, check.name);
                } else if (check.check) {
                    status = check.check();
                }

                console.log(`  ${status ? '✅' : '❌'} ${check.name}`);
            } catch (error) {
                console.log(`  ❌ ${check.name} - Error: ${error.message}`);
            }
        }

        console.log('');
        console.log('💡 Health check complete. Green checkmarks indicate healthy services.');
    }

    cleanup() {
        console.log('\n👋 Shutting down launcher...');
        this.stopAllServices();
        this.rl.close();
        process.exit(0);
    }

    async run() {
        while (true) {
            this.showHeader();
            await this.showStatus();
            this.showMenu();

            const answer = await this.question('Choose an action (0-9): ');

            switch (answer) {
                case '1':
                    await this.startFullSystem();
                    await this.question('Press Enter to continue...');
                    break;
                case '2':
                    await this.startBackend();
                    await this.question('Press Enter to continue...');
                    break;
                case '3':
                    await this.startUI();
                    await this.question('Press Enter to continue...');
                    break;
                case '4':
                    this.stopAllServices();
                    await this.question('Press Enter to continue...');
                    break;
                case '5':
                    await this.testWebhooks();
                    await this.question('Press Enter to continue...');
                    break;
                case '6':
                    this.openAdminDashboard();
                    await this.question('Press Enter to continue...');
                    break;
                case '7':
                    this.openCRMInterface();
                    await this.question('Press Enter to continue...');
                    break;
                case '8':
                    this.viewLogs();
                    await this.question('Press Enter to continue...');
                    break;
                case '9':
                    await this.healthCheck();
                    await this.question('Press Enter to continue...');
                    break;
                case '0':
                    this.cleanup();
                    return;
                default:
                    console.log('❌ Invalid option. Please choose 0-9.');
                    await this.question('Press Enter to continue...');
            }
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// Run the launcher
const launcher = new PleasantCoveLauncher();
launcher.run().catch(console.error);
