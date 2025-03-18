import Image from 'next/image';
import Link from 'next/link';
import FeatureCard from '@/components/FeatureCard';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Value Compass</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          A stock valuation and analysis tool that helps you identify undervalued stocks
          based on a customizable scoring system.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="btn-primary">
            Get Started
          </Link>
          <Link href="/about" className="btn-secondary">
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            title="Customizable Scoring" 
            description="Create your own scoring system to evaluate stocks based on the metrics that matter to you."
            icon="chart-pie"
          />
          <FeatureCard 
            title="Comprehensive Data" 
            description="Access a wide range of financial indicators, historical data, and peer comparisons."
            icon="database"
          />
          <FeatureCard 
            title="Portfolio Tracking" 
            description="Track your investment portfolios and monitor their performance over time."
            icon="briefcase"
          />
          <FeatureCard 
            title="Stock Baskets" 
            description="Create and analyze custom stock baskets for industry or thematic investing."
            icon="collection"
          />
          <FeatureCard 
            title="Automated Reports" 
            description="Schedule regular reports to stay up-to-date on your investments."
            icon="document-text"
          />
          <FeatureCard 
            title="Price Alerts" 
            description="Set up alerts for price changes or valuation score thresholds."
            icon="bell"
          />
        </div>
      </section>
    </div>
  );
}
