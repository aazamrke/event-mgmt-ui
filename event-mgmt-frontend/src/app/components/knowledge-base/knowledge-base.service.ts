import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface KbDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: 'processing' | 'indexed' | 'failed';
  uploaded_at: string;
  category?: string;
  description?: string;
}

export interface KbSearchResult {
  id: string;
  document_id: string;
  filename: string;
  content: string;
  score: number;
  chunk_index: number;
  metadata?: Record<string, any>;
}

export interface KbStats {
  total_documents: number;
  total_chunks: number;
  indexed_documents: number;
  processing_documents: number;
  failed_documents: number;
  vector_db_size_mb: number;
  last_updated: string;
}

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }

  // GET /kb/documents
  getDocuments(): Observable<KbDocument[]> {
    return this.http.get<KbDocument[]>(`${this.base}/kb/documents`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  // POST /kb/documents  (multipart upload with progress)
  uploadDocument(file: File, category: string, description: string): Observable<{ progress: number; document?: KbDocument }> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('description', description);
    const req = new HttpRequest('POST', `${this.base}/kb/documents`, fd, {
      headers: new HttpHeaders({ Authorization: this.auth.getToken() ? `Bearer ${this.auth.getToken()}` : '' }),
      reportProgress: true
    });
    return this.http.request(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          return { progress: Math.round(100 * (event.loaded / (event.total || 1))) };
        }
        if (event.type === HttpEventType.Response) {
          return { progress: 100, document: event.body as KbDocument };
        }
        return { progress: 0 };
      }),
      catchError(() => of({ progress: 100 }))
    );
  }

  // DELETE /kb/documents/:id
  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/kb/documents/${id}`, { headers: this.headers() })
      .pipe(catchError(() => of(undefined as any)));
  }

  // POST /kb/documents/:id/reindex
  reindexDocument(id: string): Observable<KbDocument> {
    return this.http.post<KbDocument>(`${this.base}/kb/documents/${id}/reindex`, {}, { headers: this.headers() })
      .pipe(catchError(() => of({} as KbDocument)));
  }

  // POST /kb/search
  search(query: string, topK = 5, category?: string): Observable<KbSearchResult[]> {
    const body: any = { query, top_k: topK };
    if (category) body.category = category;
    return this.http.post<KbSearchResult[]>(`${this.base}/kb/search`, body, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  // GET /kb/stats
  getStats(): Observable<KbStats> {
    return this.http.get<KbStats>(`${this.base}/kb/stats`, { headers: this.headers() })
      .pipe(catchError(() => of({
        total_documents: 0, total_chunks: 0, indexed_documents: 0,
        processing_documents: 0, failed_documents: 0,
        vector_db_size_mb: 0, last_updated: new Date().toISOString()
      })));
  }

  // POST /kb/rebuild  — rebuild entire vector index
  rebuildIndex(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/kb/rebuild`, {}, { headers: this.headers() })
      .pipe(catchError(() => of({ message: 'Rebuild triggered' })));
  }
}
