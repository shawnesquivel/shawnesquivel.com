export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">
            Shawn Esquivel
          </span>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
            <a
              href="#projects"
              className="transition-colors hover:text-foreground"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="transition-colors hover:text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase">
            Software Engineer
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Building products
            <br />
            <span className="text-muted">that matter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted">
            I design and build full-stack applications with a focus on clean
            code, great UX, and meaningful impact.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href="#projects"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-white/40"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
