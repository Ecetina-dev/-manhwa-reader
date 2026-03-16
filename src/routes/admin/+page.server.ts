import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

// Secure admin password (use environment variable in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'manhau_admin_2026';

// Session secret for signing tokens
const SESSION_SECRET = process.env.SESSION_SECRET || 'manhau-super-secret-key-change-in-production';

// Simple token generation (in production, use proper JWT or session library)
function generateToken(password: string): string {
  const timestamp = Date.now();
  const data = `${password}:${timestamp}`;
  // Simple base64 encoding (in production, use crypto)
  return Buffer.from(data).toString('base64');
}

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [password] = decoded.split(':');
    return password === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionToken = cookies.get('admin_session');
  
  // Verify session token
  if (sessionToken && verifyToken(sessionToken)) {
    return { authenticated: true };
  }
  
  // Clear invalid session
  cookies.delete('admin_session', { path: '/' });
  
  return { authenticated: false };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password') as string;
    
    if (!password) {
      return fail(400, { error: 'Password required' });
    }
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return fail(401, { error: 'Invalid password' });
    }
    
    // Generate secure session token
    const sessionToken = generateToken(password);
    
    // Set secure cookie
    cookies.set('admin_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 4 // 4 hours expiration
    });
    
    return { success: true };
  },
  
  logout: async ({ cookies }) => {
    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin');
  }
};
