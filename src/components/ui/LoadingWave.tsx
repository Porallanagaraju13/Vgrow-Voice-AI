import React from 'react';

// Make sure to import cn if you have a utils file, otherwise we can just use template literals.
// Assuming standard Next.js setup, but I will use standard string concatenation to be safe.
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface LoadingWaveProps {
  className?: string;
  barClassName?: string;
}

export function LoadingWave({ className, barClassName }: LoadingWaveProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1 h-6", className)}>
      <div 
        className={cn("w-1.5 h-[40%] bg-primary rounded-[2px] animate-wave", barClassName)} 
        style={{ animationDelay: '-1.2s' }} 
      />
      <div 
        className={cn("w-1.5 h-[70%] bg-primary rounded-[2px] animate-wave", barClassName)} 
        style={{ animationDelay: '-1.1s' }} 
      />
      <div 
        className={cn("w-1.5 h-[100%] bg-primary rounded-[2px] animate-wave", barClassName)} 
        style={{ animationDelay: '-1.0s' }} 
      />
      <div 
        className={cn("w-1.5 h-[70%] bg-primary rounded-[2px] animate-wave", barClassName)} 
        style={{ animationDelay: '-0.9s' }} 
      />
      <div 
        className={cn("w-1.5 h-[40%] bg-primary rounded-[2px] animate-wave", barClassName)} 
        style={{ animationDelay: '-0.8s' }} 
      />
    </div>
  );
}
