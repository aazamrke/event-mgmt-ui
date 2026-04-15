export interface TroubleshootingStep {
  id: number;
  title: string;
  description: string;
  type: 'check' | 'action' | 'diagnostic' | 'solution';
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  result?: string;
  subSteps?: TroubleshootingStep[];
}

export interface CameraIssue {
  id: string;
  category: 'connection' | 'image-quality' | 'hardware' | 'software' | 'calibration' | 'gps';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolved: boolean;
}

export interface DiagnosticResult {
  issueId: string;
  diagnosis: string;
  confidence: number;
  recommendedSteps: number[];
  estimatedTime: number;
  aiSuggestion: string;
}

export interface CameraStatus {
  cameraId: string;
  online: boolean;
  lastPing: Date;
  batteryLevel: number;
  storageUsed: number;
  gpsSignal: 'none' | 'weak' | 'good' | 'excellent';
  imageQuality: number;
  temperature: number;
  errors: string[];
}

export interface AIAgentMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'command';
  action: string;
  parameters?: any;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus  = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  cameraId: string;
  reportedBy: string;
  createdAt: Date;
  updatedAt: Date;
  stepsSnapshot: TroubleshootingStep[];
  resolution?: string;
  tags: string[];
}