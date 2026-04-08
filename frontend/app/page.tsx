import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
  CortexCardFooter,
} from "@/components/ui/cortex-card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-[0.25rem] bg-primary flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xs leading-none">
                C
              </span>
            </div>
            <span className="text-[0.9375rem] font-bold tracking-tight">
              Cortex
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#typography" className="text-nav text-muted-foreground hover:text-foreground hover:underline transition-colors">
              Typography
            </a>
            <a href="#components" className="text-nav text-muted-foreground hover:text-foreground hover:underline transition-colors">
              Components
            </a>
            <a href="#sections" className="text-nav text-muted-foreground hover:text-foreground hover:underline transition-colors">
              Layers & Dept
            </a>
            <CortexButton variant="primary" size="sm">
              Try Cortex Free
            </CortexButton>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative py-32 px-4 overflow-hidden border-b border-border gradient-neural flex flex-col items-center text-center">
        <Badge variant="synapse" dot className="mb-6">
          v1.0 Design System
        </Badge>
        <h1 className="text-display-hero text-foreground max-w-4xl mx-auto mb-6">
          Your Academic Second Brain. <br />
          <span className="gradient-text">Think Smarter.</span>
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          AI-powered notes, semantic search, and shared academic resources for university students. Powered by the Neural Purple & Warm Neutral design language.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <CortexButton variant="primary" size="lg">
            Start Learning Now
          </CortexButton>
          <CortexButton variant="secondary" size="lg">
            Explore the Docs
          </CortexButton>
        </div>
      </section>

      {/* ── Typography Section ── */}
      <section id="typography" className="py-24 px-4 bg-warm-50 dark:bg-[#111015]">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16">
            <Badge variant="muted" className="mb-3">Typography</Badge>
            <h2 className="text-section-heading">The Inter Scale</h2>
            <p className="text-body-lg text-muted-foreground mt-4 max-w-2xl">
              Like Notion, we use modified negative tracking at large display sizes to create tightly-packed, precise, billboard headlines.
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 pb-8 border-b border-border">
              <div className="w-32 flex-shrink-0 text-sm font-mono text-muted-foreground">Display Hero</div>
              <div className="text-display-hero truncate">The quick brown fox</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 pb-8 border-b border-border">
              <div className="w-32 flex-shrink-0 text-sm font-mono text-muted-foreground">Display 2</div>
              <div className="text-display-2 truncate">Jumps over the</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 pb-8 border-b border-border">
              <div className="w-32 flex-shrink-0 text-sm font-mono text-muted-foreground">Section Head</div>
              <div className="text-section-heading truncate">Lazy dog</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 pb-8 border-b border-border">
              <div className="w-32 flex-shrink-0 text-sm font-mono text-muted-foreground">Heading Large</div>
              <div className="text-heading-lg">1234567890 Semantic</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 pb-8 border-b border-border">
              <div className="w-32 flex-shrink-0 text-sm font-mono text-muted-foreground">Body Text</div>
              <div className="text-body max-w-2xl text-muted-foreground">
                We believe in creating a tactile, almost analog warmth. The typography
                should feel like high-quality paper rather than sterile glass. The quick
                brown fox jumps over the lazy dog and enables semantic search for students.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Components Section ── */}
      <section id="components" className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16">
            <Badge variant="brand" className="mb-3">Primitives</Badge>
            <h2 className="text-section-heading">Core Components</h2>
            <p className="text-body-lg text-muted-foreground mt-4 max-w-2xl">
              Crafted with a focus on tactile interaction and subtle depth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Buttons Showcase */}
            <div className="space-y-8">
              <h3 className="text-heading">Button States</h3>
              <div className="flex flex-col gap-4 items-start">
                <CortexButton variant="primary">Primary Action</CortexButton>
                <CortexButton variant="secondary">Secondary Action</CortexButton>
                <CortexButton variant="outline">Outline Button</CortexButton>
                <CortexButton variant="ghost">Ghost Button</CortexButton>
                <CortexButton variant="danger">Destructive Action</CortexButton>
                <CortexButton variant="primary" loading>Loading State</CortexButton>
              </div>
            </div>

            {/* Badges Showcase */}
            <div className="space-y-8">
              <h3 className="text-heading">Neural Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="brand" dot>Neural Brand</Badge>
                <Badge variant="synapse" dot>Synapse Info</Badge>
                <Badge variant="axon" dot>Axon Warning</Badge>
                <Badge variant="success" dot>Success State</Badge>
                <Badge variant="error" dot>Error Critical</Badge>
                <Badge variant="muted">Muted Status</Badge>
                <Badge variant="outline">Outline Tag</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cards & Depth ── */}
      <section id="sections" className="py-24 px-4 bg-warm-100 dark:bg-[#111015]">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <Badge variant="synapse" className="mb-3">Elevation</Badge>
            <h2 className="text-section-heading">Information Architecture</h2>
            <p className="text-body-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our shadows use multiple layers with extremely low individual opacity (0.01 to 0.05), to create ambient occlusion that feels like natural light.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <CortexCard level="flat" className="bg-background">
              <CortexCardHeader>
                <CortexCardTitle>Level 1: Whisper</CortexCardTitle>
                <CortexCardDescription>Flat rendering</CortexCardDescription>
              </CortexCardHeader>
              <CortexCardContent>
                1px solid rgba(0,0,0,0.1). Used for standard borders, inline elements, and data tables.
              </CortexCardContent>
            </CortexCard>

            <CortexCard level="card" className="bg-background">
              <CortexCardHeader>
                <CortexCardTitle>Level 2: Soft Card</CortexCardTitle>
                <CortexCardDescription>Multi-stack shadow</CortexCardDescription>
              </CortexCardHeader>
              <CortexCardContent>
                A 4-layer shadow stack (max opacity 0.04) creating dense, realistic elevation.
              </CortexCardContent>
              <CortexCardFooter>
                <CortexButton variant="secondary" size="sm" className="w-full">
                  Interactive Card
                </CortexButton>
              </CortexCardFooter>
            </CortexCard>

            <CortexCard level="modal" className="bg-background relative transform md:-translate-y-4">
              <div className="absolute top-4 right-4">
                <Badge variant="brand">Featured</Badge>
              </div>
              <CortexCardHeader>
                <CortexCardTitle>Level 3: Deep Focus</CortexCardTitle>
                <CortexCardDescription>5-layer ambient shadow</CortexCardDescription>
              </CortexCardHeader>
              <CortexCardContent>
                Max opacity 0.05, 52px blur. Used for modals, dialogue boxes, and Hero featured content panels.
              </CortexCardContent>
              <CortexCardFooter>
                <CortexButton variant="primary" size="sm" className="w-full">
                  Ask My Brain
                </CortexButton>
              </CortexCardFooter>
            </CortexCard>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-4 border-t border-border bg-background">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-[0.25rem] bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[0.6rem] leading-none">C</span>
            </div>
            <span className="text-caption font-bold">Cortex Platform</span>
          </div>
          <p className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} Cortex Graduation Project. Designed for academic brilliance.
          </p>
        </div>
      </footer>
    </div>
  );
}
