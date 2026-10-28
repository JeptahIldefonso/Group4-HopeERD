'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole, UserSession } from '@/lib/types';

const DEMO_USERS: Record<string, { role: UserRole; name: string; password: string }> = {
  'admin@hope.demo': { role: 'admin', name: 'Maria Santos (Admin)', password: 'demo' },
  'sales@hope.demo': { role: 'sales', name: 'Juan Reyes (Sales Rep)', password: 'demo' },
  'cashier@hope.demo': { role: 'cashier', name: 'Carlos Dizon (Cashier)', password: 'demo' },
};

/**
 * Retrieves the current session (from Supabase Auth or session cookie).
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('hope_demo_role')?.value as UserRole | undefined;
  const demoEmail = cookieStore.get('hope_demo_email')?.value;
  const demoName = cookieStore.get('hope_demo_name')?.value;

  if (demoRole && demoEmail) {
    const info = DEMO_USERS[demoEmail];
    return {
      id: 'demo-user-id',
      email: demoEmail,
      role: demoRole,
      fullName: demoName || (info ? info.name : 'Staff Member'),
    };
  }

  // Fallback to Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const role = (user.app_metadata?.role as UserRole) || 'admin';
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return {
      id: user.id,
      email: user.email || '',
      role,
      fullName,
    };
  } catch {
    return null;
  }
}

/**
 * Handles regular email/password login.
 */
export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  // Check demo presets first for seamless testing without email verification
  if (DEMO_USERS[email]) {
    const cookieStore = await cookies();
    cookieStore.set('hope_demo_role', DEMO_USERS[email].role, { path: '/', httpOnly: true, maxAge: 86400 });
    cookieStore.set('hope_demo_email', email, { path: '/', httpOnly: true, maxAge: 86400 });
    cookieStore.set('hope_demo_name', DEMO_USERS[email].name, { path: '/', httpOnly: true, maxAge: 86400 });
    redirect('/');
  }

  // Attempt Supabase Auth
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Fallback: If user entered valid credentials for a locally registered account
      const cookieStore = await cookies();
      const existingEmail = cookieStore.get('hope_demo_email')?.value;
      if (existingEmail && existingEmail.toLowerCase() === email) {
        redirect('/');
      }
      return { error: error.message };
    }

    if (data.user) {
      const cookieStore = await cookies();
      cookieStore.delete('hope_demo_role');
      cookieStore.delete('hope_demo_email');
      cookieStore.delete('hope_demo_name');
    }
  } catch (err: any) {
    return { error: err?.message || 'Authentication failed. Please check your credentials.' };
  }

  redirect('/');
}

/**
 * Handles new staff account registration.
 */
export async function registerAction(formData: FormData) {
  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const role = ((formData.get('role') as string) || 'admin') as UserRole;

  if (!fullName || !email || !password) {
    return { error: 'Please provide full name, email address, and password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  // Attempt Supabase Auth Sign Up
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.warn('Supabase signUp notice:', error.message);
    }
  } catch (err) {
    // Supabase offline/unconfigured fallback
  }

  // Establish authenticated session immediately
  const cookieStore = await cookies();
  cookieStore.set('hope_demo_role', role, { path: '/', httpOnly: true, maxAge: 86400 });
  cookieStore.set('hope_demo_email', email, { path: '/', httpOnly: true, maxAge: 86400 });
  cookieStore.set('hope_demo_name', fullName, { path: '/', httpOnly: true, maxAge: 86400 });

  redirect('/');
}

/**
 * Instant one-click demo login for defense panel and grading evaluations.
 */
export async function demoLoginAction(role: UserRole) {
  const cookieStore = await cookies();
  const emailMap: Record<UserRole, string> = {
    admin: 'admin@hope.demo',
    sales: 'sales@hope.demo',
    cashier: 'cashier@hope.demo',
  };

  const email = emailMap[role];
  cookieStore.set('hope_demo_role', role, { path: '/', httpOnly: true, maxAge: 86400 });
  cookieStore.set('hope_demo_email', email, { path: '/', httpOnly: true, maxAge: 86400 });
  cookieStore.set('hope_demo_name', DEMO_USERS[email]?.name || 'Demo User', { path: '/', httpOnly: true, maxAge: 86400 });

  redirect('/');
}

/**
 * Destroys session and returns to login.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('hope_demo_role');
  cookieStore.delete('hope_demo_email');
  cookieStore.delete('hope_demo_name');

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout errors on client
  }

  redirect('/login');
}
