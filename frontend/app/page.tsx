import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to{' '}
            <span className="text-primary-600">My App</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            A modern full-stack web application built with Next.js and FastAPI.
            Clean, modular, and production-ready.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 text-base font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="FastAPI Backend"
              description="High-performance async Python backend with automatic OpenAPI documentation."
              icon="⚡"
            />
            <FeatureCard
              title="Next.js Frontend"
              description="Server and client components with TanStack Query for optimal data fetching."
              icon="🚀"
            />
            <FeatureCard
              title="Type Safety"
              description="End-to-end type safety with TypeScript and Pydantic schemas."
              icon="🔒"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
