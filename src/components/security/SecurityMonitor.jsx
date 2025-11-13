import React, { useEffect, useRef } from 'react';
import { User } from "@/api/entities";

export default function SecurityMonitor() {
  const previousDeviceId = useRef(null);
  
  // Safe console logging function
  const safeLog = (level, message) => {
    try {
      if (console && console[level] && typeof console[level] === 'function') {
        console[level](message);
      } else if (console && console.log && typeof console.log === 'function') {
        console.log(`[${level.toUpperCase()}] ${message}`);
      }
    } catch (e) {
      // Silent fail if no console available
    }
  };
  
  // Check for suspicious activities
  useEffect(() => {
    // Skip all security checks in preview/development environment OR base44.com domain
    if (window.location.hostname.includes('base44.io') || 
        window.location.hostname.includes('base44.com') || 
        window.location.hostname.includes('app.base44.com')) {
      safeLog('log', "Running in base44 environment - security checks relaxed");
      return;
    }
    
    // Generate or retrieve device fingerprint
    const generateDeviceFingerprint = async () => {
      const screenProperties = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const languages = navigator.languages ? navigator.languages.join(',') : navigator.language;
      const deviceFingerprint = await hashString(`${screenProperties}|${timezone}|${languages}|${navigator.userAgent}`);
      
      return deviceFingerprint;
    };
    
    // Simple hash function using browser's crypto API
    const hashString = async (str) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };
    
    const checkDeviceConsistency = async () => {
      try {
        // Get the current device fingerprint
        const currentDeviceId = await generateDeviceFingerprint();
        
        // Get the stored user data
        const user = await User.me();
        
        // If we have user-stored device ID, compare it (but only log, don't block)
        if (user && user.device_fingerprint && user.device_fingerprint !== currentDeviceId) {
          safeLog('log', "Device fingerprint changed - this is normal if using different devices/browsers");
          
          // Update fingerprint silently instead of alerting
          try {
            await User.updateMyUserData({ device_fingerprint: currentDeviceId });
            safeLog('log', "Device fingerprint updated successfully");
          } catch (updateError) {
            safeLog('warn', "Could not update device fingerprint: " + (updateError.message || updateError));
          }
        } 
        // If we don't have a stored fingerprint, save it
        else if (user && !user.device_fingerprint) {
          await User.updateMyUserData({ device_fingerprint: currentDeviceId });
          safeLog('log', "Initial device fingerprint saved");
        }
        
        previousDeviceId.current = currentDeviceId;
      } catch (error) {
        safeLog('error', "Error in security check: " + (error.message || error));
      }
    };
    
    // Run security checks on load (but don't spam) - and only once
    let hasRun = false;
    const timeoutId = setTimeout(() => {
      if (!hasRun) {
        hasRun = true;
        checkDeviceConsistency();
      }
    }, 3000); // Wait 3 seconds before first check
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
    
  }, []); // Empty dependency array to run only once
  
  return null; // This is a background component with no UI
}