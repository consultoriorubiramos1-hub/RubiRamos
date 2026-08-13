import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Obtener el rol_id desde el token
    const userRole = token?.rol_id || token?.user?.rol_id;
    
    console.log('Middleware - Path:', path);
    console.log('Middleware - User Role:', userRole);
    
    // Si no hay token o no hay rol, redirigir al login
    if (!token || !userRole) {
      console.log('No hay token o rol, redirigiendo a login');
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Rutas de paciente (dentro de /admin/patient)
    if (path.startsWith("/admin/patient")) {
      if (userRole !== 2) {
        console.log('Usuario no es paciente, redirigiendo');
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
      console.log('Acceso permitido a paciente');
      return NextResponse.next();
    }
    
    // Rutas de administrador (todo lo demás dentro de /admin)
    if (path.startsWith("/admin")) {
      if (userRole !== 1) {
        console.log('Usuario no es administrador, redirigiendo');
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
      console.log('Acceso permitido a administrador');
      return NextResponse.next();
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Solo permite pasar si hay sesión
        const hasToken = !!token;
        console.log('Authorized check - Has token:', hasToken);
        return hasToken;
      },
    },
  }
);

// Proteger todas las rutas dentro de /admin
export const config = {
  matcher: [
    "/admin/:path*"
  ],
};