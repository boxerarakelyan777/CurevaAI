import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold">
          CurevaAI
        </Link>
        <div>
          {user ? (
            <button
              onClick={signOut}
              className="text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-white mr-4">
                Login
              </Link>
              <Link href="/register" className="text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}