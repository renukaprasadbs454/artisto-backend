import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <Navbar />


      <section className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800">
            Welcome to <span className="text-blue-600">Artisto</span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Connect talented professionals with companies, discover exciting
            opportunities, and build your creative career.
          </p>

          <div className="mt-10 space-x-4">
            <Link
  to="/opportunities"
  className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block"
>
  Find Opportunities
</Link>

        <Link
  to="/register"
  className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg inline-block"
>
  Hire Talent
</Link>
            

            
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-center mb-12">
      Why Choose Artisto?
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-3">Find Opportunities</h3>
        <p>Discover casting calls, jobs, internships, and freelance projects.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-3">Showcase Talent</h3>
        <p>Create a professional portfolio with photos, videos, and achievements.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-3">Connect with Companies</h3>
        <p>Build connections with studios, agencies, and recruiters.</p>
      </div>
    </div>
  </div>
</section>


<section className="py-16 bg-gray-100">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-center mb-10">
      Featured Opportunities
    </h2>

    <div className="grid md:grid-cols-3 gap-6">

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">Assistant Director</h3>
        <p className="text-gray-600 mt-2">Dream Studio Pvt Ltd</p>
        <p className="text-sm text-gray-500 mt-2">📍 Bangalore</p>
         <Link
  to="/opportunities/1"
  className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
>
  Apply Now
</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">Video Editor</h3>
        <p className="text-gray-600 mt-2">CiniVision Productions</p>
        <p className="text-sm text-gray-500 mt-2">📍 Hyderabad</p>
            <Link
  to="/opportunities/2"
  className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
>
  Apply Now
</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">Graphic Designer</h3>
        <p className="text-gray-600 mt-2">Media House</p>
        <p className="text-sm text-gray-500 mt-2">📍 Mumbai</p>
            <Link
  to="/opportunities/3"
  className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
>
  Apply Now
</Link>
      </div>

    </div>
  </div>
</section>

<section className="py-16 bg-white">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-center mb-10">
      Top Companies Hiring
    </h2>

    <div className="grid md:grid-cols-3 gap-6">

      <div className="bg-gray-100 p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">🎬 Dream Studios</h3>
        <p className="text-gray-600 mt-2">Film Production</p>
        <p className="text-sm text-gray-500 mt-2">📍 Bangalore</p>
        <Link
  to="/Company"
  className="bg-purple-600 text-white px-4 py-2 rounded-lg inline-block"
>
  View Jobs
</Link>
      </div>

      <div className="bg-gray-100 p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">🎥 CineVision Productions</h3>
        <p className="text-gray-600 mt-2">Media & Entertainment</p>
        <p className="text-sm text-gray-500 mt-2">📍 Hyderabad</p>
         <Link
  to="/Company"
  className="bg-purple-600 text-white px-4 py-2 rounded-lg inline-block"
>
  View Jobs
</Link>
      </div>

      <div className="bg-gray-100 p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold">🎨 Pixel Motion Studios</h3>
        <p className="text-gray-600 mt-2">Animation & VFX</p>
        <p className="text-sm text-gray-500 mt-2">📍 Mumbai</p>
        <Link
  to="/Company"
  className="bg-purple-600 text-white px-4 py-2 rounded-lg inline-block"
>
  View Jobs
</Link>
      </div>

    </div>
  </div>
</section>

<section className="py-16 bg-gray-100">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-center mb-10">
      Success Stories
    </h2>

    <div className="grid md:grid-cols-3 gap-6">

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="italic">
          "Artisto helped me get my first Assistant Director role. The application process was smooth and easy."
        </p>
        <h3 className="mt-4 font-semibold">⭐ Priya S.</h3>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="italic">
          "I found amazing freelance video editing projects through Artisto. Highly recommended!"
        </p>
        <h3 className="mt-4 font-semibold">⭐ Rahul K.</h3>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="italic">
          "Our production company hired talented photographers and designers quickly using Artisto."
        </p>
        <h3 className="mt-4 font-semibold">⭐ Dream Studios HR</h3>
      </div>

    </div>
  </div>
</section>

<footer className="bg-gray-900 text-white py-10">
  <div className="max-w-6xl mx-auto px-6 text-center">
    <h2 className="text-3xl font-bold">Artisto</h2>
    <p className="mt-3 text-gray-400">
      Connecting creative professionals with opportunities in film, media, and entertainment.
    </p>

    <div className="mt-6">
      <p>📧 support@artisto.com</p>
      <p>📍 Bangalore, India</p>
    </div>

    <p className="mt-6 text-gray-500">
      © 2026 Artisto. All rights reserved.
    </p>
  </div>
</footer>

    </>
  );
}



