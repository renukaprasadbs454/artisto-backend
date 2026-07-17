
  
 export default function OpportunityDetails() {
  return (

     <div className="p-10">
      
    
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-4xl font-bold text-purple-700">
          Graphic Designer
        </h1>

        <p className="text-xl text-gray-700 mt-2">
          🏢 Pixel Creative Studio
        </p>

        <div className="grid grid-cols-2 gap-4 mt-6 text-gray-700">
          <p>📍 Bengaluru</p>
          <p>💼 Full-Time</p>
          <p>💰 ₹4–6 LPA</p>
          <p>🕒 Experience: 0–2 Years</p>
          <p>📅 Posted: 18 July 2026</p>
          <p>⏳ Apply Before: 31 July 2026</p>
        </div>

        <hr className="my-8" />

        <h2 className="text-2xl font-semibold mb-3">
          Job Description
        </h2>

        <p className="text-gray-700 leading-7">
          We are looking for a creative Graphic Designer to join our team.
          You will create social media posts, marketing materials, branding
          assets, and promotional designs while collaborating with our
          creative team.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">
          Required Skills
        </h2>

        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Adobe Photoshop</li>
          <li>Adobe Illustrator</li>
          <li>Figma</li>
          <li>Creativity & Communication</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3">
          Requirements
        </h2>

        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Portfolio is preferred.</li>
          <li>Freshers can apply.</li>
          <li>Basic design knowledge is required.</li>
          <li>Good teamwork and communication skills.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3">
          About Company
        </h2>

        <p className="text-gray-700 leading-7">
          Pixel Creative Studio is a creative design agency specializing in
          branding, digital marketing, UI/UX design, and visual storytelling.
          We work with startups and established businesses to create impactful
          visual experiences.
        </p>

        <div className="flex gap-4 mt-10">
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Apply Now
          </button>

          <button className="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-100">
            Save Opportunity
          </button>

          <button className="border border-gray-400 px-6 py-3 rounded-lg hover:bg-gray-100">
            Share
          </button>
        </div>

      </div>
    </div>
    </div>
  );
}