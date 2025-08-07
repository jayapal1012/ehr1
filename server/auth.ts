import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { LoginData, User } from "@shared/schema";

export async function authenticateUser(credentials: LoginData): Promise<User | null> {
  const { username, password } = credentials;
  
  const user = await storage.getUserByUsername(username);
  if (!user || !user.isActive) {
    return null;
  }
  
  // In production, use bcrypt.compare for hashed passwords
  // For demo purposes, we're using plain text comparison
  if (user.password !== password) {
    return null;
  }
  
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generatePatientId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PT-${timestamp}-${random}`;
}
