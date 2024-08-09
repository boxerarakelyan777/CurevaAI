import Head from 'next/head';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Head>
        <title>My AI App</title>
        <meta name="description" content="AI-powered home remedy suggestions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold text-blue-600">
          Welcome to Our AI-Powered Home Remedy App
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Sign up to get on the waitlist and be the first to know when we launch!
        </p>
        <button className="mt-8 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700">
          Join the Waitlist
        </button>
      </main>

      <footer className="w-full h-24 flex items-center justify-center border-t">
        <p>&copy; 2024 My AI App. All rights reserved.</p>
      </footer>
    </div>
  );
}
