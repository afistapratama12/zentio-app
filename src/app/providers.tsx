// app/providers.jsx
"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryProvider } from "@/lib/query-provider";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from "react";

export function Providers(props: { children: React.ReactNode }) {
  return (
     <QueryProvider>
      <LanguageProvider>
        <>{props.children}</>
        {<ReactQueryDevtools initialIsOpen={false}/>}
      </LanguageProvider>
    </QueryProvider>
  );
}
