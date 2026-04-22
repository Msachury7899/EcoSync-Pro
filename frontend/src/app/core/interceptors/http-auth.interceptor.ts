import { HttpInterceptorFn } from '@angular/common/http';

// Interceptor preparado — sin guard activo en este sprint.
// Cuando se integre autenticación, añadir el token aquí:
// const token = inject(AuthService).getToken();
// req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
export const httpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
