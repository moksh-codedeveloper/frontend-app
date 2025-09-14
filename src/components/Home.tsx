// components/Home.tsx
import Link from "next/link";
import { Button } from "./ui/button";
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
        Welcome to DFIT
      </h1>
      <p className="text-lg text-gray-600 max-w-xl text-center mb-8">
        Get started by uploading your files, analyzing data, and exploring insights in a secure and user-friendly platform.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[
          { title: "Secure Upload", description: "Upload your files safely with advanced encryption." },
          { title: "Data Insights", description: "Analyze and view your data in meaningful ways." },
          { title: "User Friendly", description: "A sleek and responsive interface that adapts to your needs." },
        ].map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-500">{card.description}</p>
          </div>
        ))}
      </div>
      <Link href="/login">
        <Button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition">
          Get Started
        </Button>
      </Link>
    </div>
  );
}
