import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

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
}

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {

  private get base(): string {
    const h = window.location.hostname;
    return (h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:8000' : '';
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }

  // POST /kb/search — backend returns { answer, sources, found }
  ask(question: string): Observable<string> {
    return this.http.post<any>(`${this.base}/kb/search`, {
      query: question,
      top_k: 5,
      score_threshold: 0.1
    }, { headers: this.headers() }).pipe(
      map(res => {
        // Backend returns { answer: "...", sources: [...], found: true }
        if (res?.answer) return String(res.answer).trim();
        // Fallback: combine sources content
        if (Array.isArray(res?.sources) && res.sources.length > 0) {
          return res.sources.map((s: any) => s.content || '').filter(Boolean).join(' ').trim();
        }
        return '';
      }),
      catchError(() => of(''))
    );
  }

  // POST /kb/search — returns sources array
  search(query: string, topK = 5, category?: string): Observable<KbSearchResult[]> {
    const body: any = { query, top_k: topK, score_threshold: 0.1 };
    if (category) body.category = category;
    return this.http.post<any>(`${this.base}/kb/search`, body, { headers: this.headers() })
      .pipe(
        map(res => {
          // Response shape: { answer, sources: [...], found }
          if (Array.isArray(res?.sources)) return res.sources as KbSearchResult[];
          if (Array.isArray(res)) return res as KbSearchResult[];
          if (Array.isArray(res?.results)) return res.results;
          return [];
        }),
        catchError(() => of([]))
      );
  }

  // GET /kb/documents
  getDocuments(): Observable<KbDocument[]> {
    return this.http.get<KbDocument[]>(`${this.base}/kb/documents`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  // POST /kb/documents (multipart upload with progress)
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

  // GET /kb/stats
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/kb/stats`, { headers: this.headers() })
      .pipe(catchError(() => of({
        total_documents: 0, total_chunks: 0, indexed_documents: 0,
        processing_documents: 0, failed_documents: 0,
        vector_db_size_mb: 0, last_updated: new Date().toISOString()
      })));
  }

  // POST /kb/rebuild
  rebuildIndex(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/kb/rebuild`, {}, { headers: this.headers() })
      .pipe(catchError(() => of({ message: 'Rebuild triggered' })));
  }
}
