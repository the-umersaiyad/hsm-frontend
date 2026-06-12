'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wrench, Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Dynamic Mouse Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`,
        }}
      />

      {/* Ambient Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-30 w-full max-w-4xl px-4 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        
        {/* Left Side: Massive Glowing 404 */}
        <div className="relative flex-1 flex justify-center md:justify-end group">
          <div className="relative transition-transform duration-700 ease-out group-hover:scale-105">
            {/* Glossy Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent blur-3xl opacity-50 rounded-full transition-opacity duration-500 group-hover:opacity-80" />
            
            <h1 className="relative text-[150px] sm:text-[200px] md:text-[250px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-background drop-shadow-sm select-none">
              404
            </h1>
            
            {/* Floating Wrench Badge */}
            <div className="absolute bottom-10 right-0 md:-right-10 bg-background/80 backdrop-blur-xl border border-border p-4 sm:p-6 rounded-3xl shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
              <Wrench className="w-10 h-10 sm:w-14 sm:h-14 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Right Side: Content and Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold tracking-wide uppercase shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            Page Not Found
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight z-40 relative">
            Looks like this page needs a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">repair</span>.
          </h2>

          <p className="text-lg text-muted-foreground max-w-md leading-relaxed z-40 relative">
            The page you are looking for has gone missing, been renamed, or perhaps the URL is just a bit rusty. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto relative z-40">
            <Button 
              asChild 
              size="lg" 
              className="h-14 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Back to Dashboard
              </Link>
            </Button>
            
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-border hover:bg-muted hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
