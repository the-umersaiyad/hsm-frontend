import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column - Visual Side */}
      <div className="hidden lg:block relative h-screen sticky top-0">
        <Image
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80"
          alt="Professional home service worker"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/homefixcareicon-removebg-preview.jpg"
              alt="HomeFixCare Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold">HomeFixCare</span>
          </div>

          <div className="space-y-4 max-w-md">
            <blockquote className="text-2xl font-semibold leading-relaxed">
              "Professional home services at your fingertips"
            </blockquote>
            <p className="text-white/80 text-lg">
              Connect with trusted service providers for all your home maintenance needs.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Verified Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form Area */}
      <div className="flex items-center justify-center p-4 lg:p-8 bg-background dark:bg-slate-950 relative overflow-hidden">
        {/* Subtle tool icon pattern background */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.05]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="tool-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* Wrench */}
                <g transform="translate(10, 10) rotate(-30, 16, 16)" fill="currentColor">
                  <path d="M20.5 3.5a6 6 0 0 0-6 6c0 .9.2 1.7.5 2.5L3.5 23.5l2 2 11.5-11.5c.8.3 1.6.5 2.5.5a6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                </g>
                {/* Hammer */}
                <g transform="translate(70, 10)" fill="currentColor">
                  <path d="M9.5 2L2 9.5l1.5 1.5 2-2 9 9 1.5-1.5-9-9 2-2L9.5 2zm5 5l-1.5 1.5 3 3 1.5-1.5-3-3z" />
                  <rect x="13" y="1" width="8" height="5" rx="1" transform="rotate(45, 17, 3.5)" />
                </g>
                {/* Screwdriver */}
                <g transform="translate(10, 70) rotate(45, 12, 12)" fill="currentColor">
                  <rect x="10" y="2" width="4" height="14" rx="1" />
                  <rect x="9" y="16" width="6" height="8" rx="1" />
                  <rect x="11" y="24" width="2" height="4" />
                </g>
                {/* Paint brush */}
                <g transform="translate(70, 70)" fill="currentColor">
                  <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z" />
                </g>
                {/* Gear */}
                <g transform="translate(40, 40)" fill="currentColor">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.3.07-.62.07-.93s-.03-.64-.07-1l2.16-1.63c.19-.15.24-.42.12-.64l-2.05-3.55c-.12-.22-.39-.3-.61-.22l-2.55 1c-.53-.4-1.1-.73-1.72-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.62.25-1.19.59-1.72.98l-2.55-1c-.22-.08-.49 0-.61.22L2.2 8.82c-.12.22-.07.49.12.64L4.48 11.1c-.04.36-.07.7-.07 1.06s.03.7.07 1.06l-2.16 1.63c-.19.15-.24.42-.12.64l2.05 3.55c.12.22.39.3.61.22l2.55-1c.53.4 1.1.73 1.72.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.62-.25 1.19-.59 1.72-.98l2.55 1c.22.08.49 0 .61-.22l2.05-3.55c.12-.22.07-.49-.12-.64l-2.16-1.63z" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tool-pattern)" className="text-primary" />
          </svg>
        </div>
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Image
              src="/homefixcareicon-removebg-preview.jpg"
              alt="HomeFixCare Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-foreground">HomeFixCare</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
