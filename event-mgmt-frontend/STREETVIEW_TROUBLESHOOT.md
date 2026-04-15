# Street View Camera Troubleshooting System

## Overview

Comprehensive AI-powered troubleshooting system for Google Maps Street View camera issues with real-time feedback and step-by-step guidance.

## Features

### 🤖 AI Assistant Chat Interface
- **Natural Language Processing**: Describe issues in plain language
- **Contextual Responses**: AI provides relevant troubleshooting steps
- **Quick Action Buttons**: Pre-defined issue categories for fast diagnosis
- **Real-time Feedback**: Instant responses and guidance
- **Conversation History**: Track all interactions and solutions

### 📊 Real-Time Camera Status Monitoring
- **Connection Status**: Online/offline monitoring
- **Battery Level**: Visual battery indicator with alerts
- **Storage Usage**: Track available storage space
- **GPS Signal Strength**: Monitor satellite connectivity
- **Image Quality**: Real-time quality metrics
- **Temperature Monitoring**: Overheat detection
- **Error Tracking**: Active error list and notifications
- **Last Ping Time**: Connection health monitoring

### 📋 Step-by-Step Troubleshooting
- **Progressive Guidance**: Sequential troubleshooting steps
- **Visual Progress Tracking**: Progress bar and completion status
- **Step Types**:
  - ✅ **Check**: Verification steps
  - 🔧 **Action**: Corrective actions
  - 🔍 **Diagnostic**: System tests
  - 💡 **Solution**: Final resolutions
- **Step Management**: Mark complete, skip, or retry
- **Result Tracking**: Record outcomes for each step

### 🎯 Issue Categories

#### 1. Connection Issues
- Physical connection verification
- Power supply checks
- Network connectivity tests
- System restart procedures

#### 2. Image Quality Problems
- Lens cleaning guidance
- Focus adjustment
- Exposure optimization
- Lighting condition tests

#### 3. GPS Issues
- Antenna connection checks
- Sky visibility verification
- Firmware updates
- GPS calibration

#### 4. Hardware Problems
- Visual damage inspection
- Hardware diagnostic tests
- Temperature monitoring
- Storage media verification

### 🚀 Quick Actions
- **Run Full Diagnostic**: Comprehensive system check
- **Restart Camera**: Remote camera reboot
- **View Logs**: Access system logs
- **Export Report**: Generate troubleshooting report

## User Interface

### Three-Panel Layout

#### Left Panel: Camera Status
- Real-time metrics and health indicators
- Quick action buttons
- Error notifications

#### Center Panel: AI Chat
- Conversational interface
- Message history
- Action buttons for common issues
- Auto-scrolling chat window

#### Right Panel: Step Guidance
- Current troubleshooting workflow
- Progress tracking
- Step-by-step instructions
- Completion controls

## Technical Architecture

### Components

1. **StreetviewTroubleshootComponent** (Main Dashboard)
   - Orchestrates all sub-components
   - Manages state and data flow
   - Handles user interactions

2. **ChatInterfaceComponent**
   - AI conversation interface
   - Message rendering
   - Action button handling
   - Auto-scroll functionality

3. **StepGuidanceComponent**
   - Step-by-step workflow display
   - Progress tracking
   - Step status management
   - Completion/skip controls

4. **CameraStatusComponent**
   - Real-time status display
   - Metric visualization
   - Health indicators
   - Refresh functionality

### Services

**TroubleshootingAgentService**
- AI message generation
- Diagnostic workflow management
- Step status tracking
- Camera status simulation
- Issue categorization

### Data Models

- **AIAgentMessage**: Chat messages with actions
- **TroubleshootingStep**: Workflow step definition
- **CameraStatus**: Real-time camera metrics
- **DiagnosticResult**: Analysis outcomes
- **CameraIssue**: Issue tracking

## Usage

### Starting a Troubleshooting Session

1. Navigate to `/troubleshoot` route
2. Review camera status in left panel
3. Select issue category or describe problem
4. Follow AI-guided steps in right panel
5. Mark steps complete as you progress
6. Export report when resolved

### AI Interaction

```typescript
// User describes issue
"Camera is not connecting to the network"

// AI responds with diagnosis
"I understand you're experiencing connection issues. 
Let me guide you through the troubleshooting steps."

// AI provides action buttons
[Check Physical Connections] [Test Network] [Restart Camera]
```

### Step Workflow

```
1. Check Physical Connections ✓ Completed
2. Verify Power Supply ✓ Completed
3. Test Network Connection → In Progress
4. Restart Camera System ⏳ Pending
```

## API Integration (Backend)

### Expected Endpoints

```typescript
// Get camera status
GET /api/camera/{cameraId}/status
Response: CameraStatus

// Start diagnostic
POST /api/troubleshoot/diagnose
Body: { issueType: string, cameraId: string }
Response: DiagnosticResult

// Update step status
PUT /api/troubleshoot/step/{stepId}
Body: { status: string, result: string }

// Get AI response
POST /api/ai/chat
Body: { message: string, context: object }
Response: AIAgentMessage

// Export report
GET /api/troubleshoot/report/{sessionId}
Response: PDF/JSON report
```

## Responsive Design

- **Desktop**: Full three-panel layout
- **Tablet**: Stacked panels with priority to chat
- **Mobile**: Single-column view with tabs

## Future Enhancements

- [ ] Video call support for remote assistance
- [ ] Image upload for visual diagnostics
- [ ] Historical issue tracking and analytics
- [ ] Predictive maintenance alerts
- [ ] Multi-camera management
- [ ] Integration with Google Maps API
- [ ] Automated testing workflows
- [ ] Machine learning-based diagnostics

## Demo Mode

The system works in demo mode with:
- Simulated camera status
- Mock AI responses
- Sample troubleshooting workflows
- Realistic data visualization

## Benefits

✅ **Reduced Downtime**: Quick issue identification
✅ **Guided Resolution**: Step-by-step instructions
✅ **Knowledge Base**: AI-powered suggestions
✅ **Real-time Monitoring**: Proactive issue detection
✅ **Documentation**: Automatic report generation
✅ **User-Friendly**: Intuitive interface for all skill levels