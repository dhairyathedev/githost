import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, GitCommit, GitMerge, Github } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Github className="h-6 w-6" />
            <span className="text-xl font-bold">GitHost</span>
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link
              href="#features"
              className="hover:text-gray-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-gray-600 transition-colors"
            >
              How It Works
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Deploy your code with ease
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            GitHost provides free, fast, and secure hosting for your web
            projects. Connect your GitHub repository and go live in minutes.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href={"/dashboard"}>
              <Button size="lg">Start Deploying</Button>
            </Link>
            <Link href={"/aboutus"}>
              <Button variant="outline" size="lg">
                About Us
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose GitHost?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <GitBranch className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Automatic Deployments
                </h3>
                <p>
                  Push to your repository and we'll automatically deploy your
                  changes.
                </p>
              </div>
              <div className="text-center">
                <GitCommit className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Instant Rollbacks
                </h3>
                <p>Revert to any previous deployment with just one click.</p>
              </div>
              <div className="text-center">
                <GitMerge className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Preview Deployments
                </h3>
                <p>
                  Get a unique URL for every pull request to preview changes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="max-w-3xl mx-auto">
              <ol className="relative border-l border-gray-200">
                <li className="mb-10 ml-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                  <h3 className="text-lg font-semibold">
                    Connect Your Repository
                  </h3>
                  <p className="mb-4">
                    Link your GitHub repository to GitHost with just a few
                    clicks.
                  </p>
                </li>
                <li className="mb-10 ml-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                  <h3 className="text-lg font-semibold">
                    Configure Your Project
                  </h3>
                  <p className="mb-4">
                    Set up your build commands and environment variables if
                    needed.
                  </p>
                </li>
                <li className="mb-10 ml-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                  <h3 className="text-lg font-semibold">Push Your Code</h3>
                  <p className="mb-4">
                    Commit and push your changes to your repository.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                  <h3 className="text-lg font-semibold">Your Site is Live!</h3>
                  <p className="mb-4">
                    GitHost automatically deploys your site and provides you
                    with a live URL.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">
              Ready to simplify your deployments?
            </h2>
            <div className="max-w-md mx-auto">
              <form className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow"
                />
                <Button type="submit">Get Started</Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Github className="h-6 w-6" />
              <span className="text-xl font-bold">GitHost</span>
            </div>
            <nav className="flex space-x-4">
              <Link href="#" className="hover:text-gray-600 transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">
                Contact
              </Link>
            </nav>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} GitHost. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
