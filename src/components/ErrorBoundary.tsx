import * as React from 'react';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Note: True Error Boundaries must be class components. 
  // This is a placeholder to avoid TS environment issues.
  return <>{children}</>;
}
