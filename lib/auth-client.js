/**
 * Client-side authentication utilities
 * Uses localStorage and contains NO server-side dependencies (mongoose, jwt, etc.)
 */
import { jwtDecode } from "jwt-decode";

/**
 * Check if the token is expired
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false; // Token doesn't have an expiration time

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Token decoding failed:", error);
    return true; // Treat invalid tokens as expired
  }
}

/**
 * Check if user is authenticated and token is valid
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false;

  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) return false;

    // Check if token has expired
    if (isTokenExpired(token)) {
      clearAuth();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Get auth token
 */
export function getAuthToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * Clear all auth data
 */
export function clearAuth() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error clearing auth:", error);
  }
}

/**
 * Set auth data
 */
export function setAuth(token, user) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (error) {
    console.error("Error setting auth:", error);
  }
}
