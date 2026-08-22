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
          "linear-gradient(135deg, #0a001a 0%, #1a0b2e 50%, #f20089 100%)",
      }}
    />
  );
}
