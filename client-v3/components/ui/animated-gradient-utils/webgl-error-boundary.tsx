"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL AnimatedGradient error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export function WebGLFallback({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #f20089 0%, #1a0b2e 45%, #0a001a 100%)",
        backgroundSize: "200% 200%",
        animation: "auroraPulse 8s ease-in-out infinite alternate",
      }}
    />
  );
}
