import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AIAgentMessage, TroubleshootingStep, DiagnosticResult, CameraStatus } from '../models/troubleshooting.models';
import { VoiceService } from './voice.service';

@Injectable({
  providedIn: 'root'
})
export class TroubleshootingAgentService {
  private messagesSubject = new BehaviorSubject<AIAgentMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private currentStepsSubject = new BehaviorSubject<TroubleshootingStep[]>([]);
  public currentSteps$ = this.currentStepsSubject.asObservable();

  constructor(private voiceService: VoiceService) {
    this.initializeAgent();
  }

  private initializeAgent(): void {
    const welcomeMessage: AIAgentMessage = {
      id: '1',
      type: 'agent',
      content: 'Hello! I\'m your Street View Camera Troubleshooting Assistant. I can help you diagnose and fix camera issues. What problem are you experiencing?',
      timestamp: new Date(),
      actions: [
        { id: 'a1', label: 'Camera Not Connecting', type: 'button', action: 'diagnose_connection' },
        { id: 'a2', label: 'Poor Image Quality', type: 'button', action: 'diagnose_quality' },
        { id: 'a3', label: 'GPS Issues', type: 'button', action: 'diagnose_gps' },
        { id: 'a4', label: 'Hardware Problems', type: 'button', action: 'diagnose_hardware' }
      ]
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  sendMessage(content: string, speakResponse = false): Observable<AIAgentMessage> {
    const userMessage: AIAgentMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    const messages = this.messagesSubject.value;
    this.messagesSubject.next([...messages, userMessage]);

    return this.generateAgentResponse(content, speakResponse).pipe(delay(1000));
  }

  private generateAgentResponse(userInput: string, speak = false): Observable<AIAgentMessage> {
    const response: AIAgentMessage = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: `I understand you're experiencing: "${userInput}". Let me analyze this and provide step-by-step guidance.`,
      timestamp: new Date()
    };

    const messages = this.messagesSubject.value;
    this.messagesSubject.next([...messages, response]);

    if (speak) {
      setTimeout(() => this.voiceService.speak(response.content), 200);
    }

    return of(response);
  }

  startDiagnostic(issueType: string): Observable<DiagnosticResult> {
    const steps = this.generateTroubleshootingSteps(issueType);
    this.currentStepsSubject.next(steps);

    const result: DiagnosticResult = {
      issueId: Date.now().toString(),
      diagnosis: `Analyzing ${issueType} issue...`,
      confidence: 0.85,
      recommendedSteps: steps.map(s => s.id),
      estimatedTime: steps.length * 2,
      aiSuggestion: 'Follow the steps below to resolve the issue.'
    };

    return of(result).pipe(delay(1500));
  }

  private generateTroubleshootingSteps(issueType: string): TroubleshootingStep[] {
    const stepTemplates: { [key: string]: TroubleshootingStep[] } = {
      diagnose_connection: [
        {
          id: 1,
          title: 'Check Physical Connections',
          description: 'Verify all cables are securely connected',
          type: 'check',
          status: 'pending'
        },
        {
          id: 2,
          title: 'Verify Power Supply',
          description: 'Ensure camera is receiving adequate power',
          type: 'check',
          status: 'pending'
        },
        {
          id: 3,
          title: 'Test Network Connection',
          description: 'Check WiFi/Ethernet connectivity',
          type: 'diagnostic',
          status: 'pending'
        },
        {
          id: 4,
          title: 'Restart Camera System',
          description: 'Power cycle the camera device',
          type: 'action',
          status: 'pending'
        }
      ],
      diagnose_quality: [
        {
          id: 1,
          title: 'Clean Camera Lens',
          description: 'Remove dust and debris from lens surface',
          type: 'action',
          status: 'pending'
        },
        {
          id: 2,
          title: 'Check Focus Settings',
          description: 'Verify auto-focus is enabled and working',
          type: 'check',
          status: 'pending'
        },
        {
          id: 3,
          title: 'Adjust Exposure Settings',
          description: 'Optimize brightness and contrast',
          type: 'action',
          status: 'pending'
        },
        {
          id: 4,
          title: 'Test in Different Lighting',
          description: 'Capture test images in various conditions',
          type: 'diagnostic',
          status: 'pending'
        }
      ],
      diagnose_gps: [
        {
          id: 1,
          title: 'Check GPS Antenna',
          description: 'Ensure GPS antenna is properly connected',
          type: 'check',
          status: 'pending'
        },
        {
          id: 2,
          title: 'Verify Sky Visibility',
          description: 'Ensure clear view of sky for satellite signals',
          type: 'check',
          status: 'pending'
        },
        {
          id: 3,
          title: 'Update GPS Firmware',
          description: 'Check for and install GPS module updates',
          type: 'action',
          status: 'pending'
        },
        {
          id: 4,
          title: 'Calibrate GPS Module',
          description: 'Run GPS calibration routine',
          type: 'action',
          status: 'pending'
        }
      ],
      diagnose_hardware: [
        {
          id: 1,
          title: 'Visual Inspection',
          description: 'Check for physical damage or loose components',
          type: 'check',
          status: 'pending'
        },
        {
          id: 2,
          title: 'Run Hardware Diagnostics',
          description: 'Execute built-in hardware test suite',
          type: 'diagnostic',
          status: 'pending'
        },
        {
          id: 3,
          title: 'Check Temperature',
          description: 'Verify camera is operating within temperature range',
          type: 'check',
          status: 'pending'
        },
        {
          id: 4,
          title: 'Test Storage Media',
          description: 'Verify SD card or storage is functioning',
          type: 'diagnostic',
          status: 'pending'
        }
      ]
    };

    return stepTemplates[issueType] || [];
  }

  updateStepStatus(stepId: number, status: TroubleshootingStep['status'], result?: string): void {
    const steps = this.currentStepsSubject.value.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    );
    this.currentStepsSubject.next(steps);
  }

  getCameraStatus(): Observable<CameraStatus> {
    const mockStatus: CameraStatus = {
      cameraId: 'SV-CAM-001',
      online: true,
      lastPing: new Date(),
      batteryLevel: 78,
      storageUsed: 45,
      gpsSignal: 'good',
      imageQuality: 92,
      temperature: 35,
      errors: []
    };
    return of(mockStatus).pipe(delay(500));
  }
}