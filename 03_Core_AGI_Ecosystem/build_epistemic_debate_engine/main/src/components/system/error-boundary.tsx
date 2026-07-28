'use client';
import React from 'react';

export class SystemErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-8 text-red-500">SYSTEM CRITICAL FAILURE: CORE RECOVERY REQUIRED</div>;
    return this.props.children;
  }
}