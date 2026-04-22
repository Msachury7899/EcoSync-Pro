import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, HttpClient, HttpInterceptorFn, provideHttpClient as phc } from '@angular/common/http';
import { httpAuthInterceptor } from './http-auth.interceptor';
import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

describe('httpAuthInterceptor', () => {
  it('should pass through requests unchanged', (done) => {
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = (r) => of(new HttpResponse({ status: 200, body: 'ok' }));

    httpAuthInterceptor(req, next).subscribe(response => {
      expect(response).toBeTruthy();
      done();
    });
  });

  it('should not modify headers', (done) => {
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = (r) => {
      expect(r.headers.has('Authorization')).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    };

    httpAuthInterceptor(req, next).subscribe(() => done());
  });
});
