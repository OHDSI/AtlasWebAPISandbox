export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading indicator with optional message.
 */
export function Loading({ message = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses: Record<string, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading"
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-gray-300 border-t-blue-600 animate-spin`}
        aria-hidden="true"
      />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

export default Loading;
