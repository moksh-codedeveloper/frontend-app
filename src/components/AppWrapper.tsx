// components/AppWrapper.tsx - Create this component
"use client";
import { useEffect } from 'react';
import { setupAxiosInterceptors } from '@/utils/getCsrfToken';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  useEffect(() => {
    // Setup axios interceptors once when the app loads
    setupAxiosInterceptors();
    console.log('CSRF interceptors setup complete');
  }, []);

  return <>{children}</>;
}

// Then in your app/layout.tsx, wrap your app with this component:
/*
import AppWrapper from '@/components/AppWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
*/