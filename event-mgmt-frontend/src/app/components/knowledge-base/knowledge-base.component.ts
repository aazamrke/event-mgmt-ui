import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="header-card">
        <div class="header-icon">
          <span class="material-icons">menu_book</span>
        </div>
        <div>
          <h1 class="title">Knowledge Base</h1>
          <p class="sub">Upload documents to update the vector database and enable semantic search.</p>
        </div>
      </div>

      <!-- Upload Card -->
      <div class="card" style="margin-top:20px">
        <div class="card-head">
          <span class="material-icons">upload_file</span>
          <span class="card-title">Upload Document</span>
        </div>

        <!-- Drop zone -->
        <div class="drop-zone"
             [class.has-file]="selectedFile"
             [class.drag-over]="isDragging"
             (click)="fileInput.click()"
             (dragover)="onDragOver($event)"
             (dragleave)="isDragging=false"
             (drop)="onDrop($event)">
          <input #fileInput type="file"
                 accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                 hidden (change)="onFileChange($event)">

          <ng-container *ngIf="!selectedFile">
            <span class="material-icons dz-icon">cloud_upload</span>
            <p class="dz-text">Drag & drop a file here or <span class="dz-link">browse</span></p>
            <p class="dz-hint">PDF, DOC, DOCX, TXT, MD, CSV, JSON — max 50 MB</p>
          </ng-container>

          <div class="file-preview" *ngIf="selectedFile" (click)="$event.stopPropagation()">
            <div class="file-icon-wrap">
              <span class="material-icons file-icon">{{getFileIcon()}}</span>
            </div>
            <div class="file-info">
              <div class="file-name">{{selectedFile.name}}</div>
              <div class="file-size">{{formatSize(selectedFile.size)}}</div>
            </div>
            <button class="remove-btn" (click)="removeFile()">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>

        <!-- Metadata fields -->
        <div class="meta-row" *ngIf="selectedFile">
          <div class="field-group">
            <label>Category</label>
            <div class="select-wrap">
              <span class="material-icons fi">category</span>
              <select [(ngModel)]="category">
                <option value="">Select category...</option>
                <option value="camera_system">Camera System</option>
                <option value="connectivity">Connectivity</option>
                <option value="hardware">Power & Hardware</option>
                <option value="software">Software Issues</option>
                <option value="storage">Storage & Data</option>
                <option value="gps">GPS & Location</option>
                <option value="general">General</option>
              </select>
              <span class="material-icons sa">expand_more</span>
            </div>
          </div>
          <div class="field-group" style="flex:2">
            <label>Description <span class="opt">(optional)</span></label>
            <div class="input-wrap">
              <span class="material-icons fi">notes</span>
              <input type="text" [(ngModel)]="description" placeholder="Brief description of this document...">
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-wrap" *ngIf="uploading">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="uploadProgress"></div>
          </div>
          <span class="progress-label">{{uploadProgress}}% — {{uploadProgress < 100 ? 'Uploading...' : 'Processing...'}}</span>
        </div>

        <!-- Upload button -->
        <div class="upload-actions" *ngIf="selectedFile && !uploading">
          <button class="btn-outline" (click)="removeFile()">
            <span class="material-icons">close</span> Cancel
          </button>
          <button class="btn-primary" (click)="upload()" [disabled]="!selectedFile">
            <span class="material-icons">upload</span> Upload & Index
          </button>
        </div>

        <!-- Success message -->
        <div class="success-msg" *ngIf="uploadSuccess">
          <span class="material-icons">check_circle</span>
          Document uploaded and indexed successfully!
          <button class="btn-link" (click)="reset()">Upload another</button>
        </div>

        <!-- Error message -->
        <div class="error-msg" *ngIf="uploadError">
          <span class="material-icons">error</span>
          {{uploadError}}
          <button class="btn-link" (click)="uploadError=''">Dismiss</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding:28px 32px; background:#f8f9fa; height:100%; overflow-y:auto; font-family:'Google Sans','Roboto',sans-serif; }

    .header-card {
      display:flex; align-items:center; gap:16px;
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      padding:20px 24px; box-shadow:0 1px 3px rgba(60,64,67,.1); border-left:4px solid #1a73e8;
    }
    .header-icon { width:48px; height:48px; border-radius:12px; background:#e8f0fe; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .header-icon .material-icons { font-size:26px; color:#1a73e8; }
    .title { font-size:20px; font-weight:600; color:#202124; margin:0 0 4px; }
    .sub   { font-size:14px; color:#5f6368; margin:0; }

    .card { background:#fff; border:1px solid #dadce0; border-radius:8px; padding:24px; box-shadow:0 1px 3px rgba(60,64,67,.08); }
    .card-head { display:flex; align-items:center; gap:8px; margin-bottom:20px; }
    .card-head .material-icons { font-size:20px; color:#1a73e8; }
    .card-title { font-size:15px; font-weight:600; color:#202124; }

    /* Drop zone */
    .drop-zone {
      border:2px dashed #dadce0; border-radius:8px; padding:36px 20px;
      text-align:center; cursor:pointer; transition:all 0.15s; background:#fafafa;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color:#1a73e8; background:#e8f0fe; }
    .drop-zone.has-file { border-style:solid; border-color:#1a73e8; padding:20px; background:#fff; }
    .dz-icon { font-size:44px !important; color:#dadce0; display:block; margin:0 auto 10px; }
    .dz-text { font-size:14px; color:#5f6368; margin:0 0 6px; }
    .dz-link { color:#1a73e8; font-weight:500; }
    .dz-hint { font-size:12px; color:#9aa0a6; margin:0; }

    .file-preview { display:flex; align-items:center; gap:14px; }
    .file-icon-wrap { width:44px; height:44px; border-radius:10px; background:#e8f0fe; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .file-icon { font-size:24px; color:#1a73e8; }
    .file-info { flex:1; text-align:left; }
    .file-name { font-size:14px; font-weight:500; color:#202124; }
    .file-size { font-size:12px; color:#5f6368; margin-top:2px; }
    .remove-btn { background:transparent; border:none; cursor:pointer; color:#9aa0a6; display:flex; align-items:center; padding:4px; border-radius:50%; transition:all 0.15s; }
    .remove-btn:hover { background:#fce8e6; color:#ea4335; }
    .remove-btn .material-icons { font-size:18px; }

    /* Metadata */
    .meta-row { display:flex; gap:14px; margin-top:16px; }
    .field-group { display:flex; flex-direction:column; gap:5px; flex:1; }
    label { font-size:12px; font-weight:500; color:#5f6368; text-transform:uppercase; letter-spacing:0.04em; }
    .opt { text-transform:none; font-weight:400; color:#9aa0a6; }
    .input-wrap, .select-wrap {
      display:flex; align-items:center; background:#fff; border:1px solid #dadce0;
      border-radius:4px; transition:border-color 0.15s, box-shadow 0.15s;
    }
    .input-wrap:focus-within, .select-wrap:focus-within { border-color:#1a73e8; box-shadow:0 0 0 2px #e8f0fe; }
    .fi { color:#9aa0a6; font-size:18px; padding:0 10px; flex-shrink:0; }
    .input-wrap input { flex:1; border:none; outline:none; background:transparent; color:#202124; font-size:14px; padding:10px 10px 10px 0; font-family:inherit; }
    .input-wrap input::placeholder { color:#9aa0a6; }
    .select-wrap { position:relative; }
    .select-wrap select { flex:1; border:none; outline:none; background:transparent; color:#202124; font-size:14px; padding:10px 32px 10px 0; font-family:inherit; appearance:none; cursor:pointer; }
    .sa { position:absolute; right:8px; color:#5f6368; font-size:18px; pointer-events:none; }

    /* Progress */
    .progress-wrap { margin-top:16px; }
    .progress-bar { height:6px; background:#f1f3f4; border-radius:3px; overflow:hidden; margin-bottom:6px; }
    .progress-fill { height:100%; background:#1a73e8; border-radius:3px; transition:width 0.3s ease; }
    .progress-label { font-size:12px; color:#5f6368; }

    /* Actions */
    .upload-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
    .btn-primary { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:4px; border:none; background:#1a73e8; color:#fff; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s; font-family:inherit; }
    .btn-primary:hover { background:#1557b0; }
    .btn-primary:disabled { background:#dadce0; color:#9aa0a6; cursor:not-allowed; }
    .btn-primary .material-icons { font-size:16px; }
    .btn-outline { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:4px; border:1px solid #dadce0; background:#fff; color:#5f6368; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:inherit; }
    .btn-outline:hover { border-color:#ea4335; color:#ea4335; }
    .btn-outline .material-icons { font-size:16px; }

    /* Messages */
    .success-msg, .error-msg {
      display:flex; align-items:center; gap:8px; margin-top:16px;
      padding:12px 16px; border-radius:6px; font-size:14px;
    }
    .success-msg { background:#e6f4ea; color:#137333; border:1px solid #a8d5b5; }
    .success-msg .material-icons { color:#34a853; }
    .error-msg { background:#fce8e6; color:#c5221f; border:1px solid #f5c6c2; }
    .error-msg .material-icons { color:#ea4335; }
    .btn-link { background:none; border:none; cursor:pointer; color:inherit; font-weight:600; text-decoration:underline; margin-left:auto; font-family:inherit; font-size:13px; }
  `]
})
export class KnowledgeBaseComponent {
  selectedFile: File | null = null;
  category = '';
  description = '';
  isDragging = false;
  uploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
  uploadError = '';

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  setFile(file: File): void {
    this.selectedFile = file;
    this.uploadSuccess = false;
    this.uploadError = '';
  }

  removeFile(): void {
    this.selectedFile = null;
    this.category = '';
    this.description = '';
    this.uploadSuccess = false;
    this.uploadError = '';
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.uploadProgress = 0;
    // Simulate progress — replace with real KnowledgeBaseService.uploadDocument() call
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.uploading = false;
        this.uploadSuccess = true;
        this.selectedFile = null;
      }
    }, 200);
  }

  reset(): void {
    this.uploadSuccess = false;
    this.selectedFile = null;
    this.category = '';
    this.description = '';
  }

  getFileIcon(): string {
    const ext = this.selectedFile?.name.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      pdf: 'picture_as_pdf', doc: 'description', docx: 'description',
      txt: 'text_snippet', md: 'text_snippet', csv: 'table_chart', json: 'data_object'
    };
    return map[ext || ''] || 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
