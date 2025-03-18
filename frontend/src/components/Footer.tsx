import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="self-center text-xl font-semibold text-gray-900 dark:text-white">Value Compass</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              A stock valuation and analysis tool that helps you identify undervalued stocks.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">Resources</h2>
              <ul className="text-gray-600 dark:text-gray-400">
                <li className="mb-2">
                  <Link href="/about" className="hover:text-primary-600 dark:hover:text-primary-400">About</Link>
                </li>
                <li className="mb-2">
                  <Link href="/pricing" className="hover:text-primary-600 dark:hover:text-primary-400">Pricing</Link>
                </li>
                <li className="mb-2">
                  <Link href="/docs" className="hover:text-primary-600 dark:hover:text-primary-400">Documentation</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">Legal</h2>
              <ul className="text-gray-600 dark:text-gray-400">
                <li className="mb-2">
                  <Link href="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</Link>
                </li>
                <li className="mb-2">
                  <Link href="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} Value Compass. All Rights Reserved.
          </span>
          <div className="flex mt-4 md:mt-0 space-x-6">
            {/* Social media links could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
