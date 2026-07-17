export default function Companies() {
  const companies = [
    {
      name: "Dream Studios",
      industry: "Film Production",
      location: "Bangalore",
    },
    {
      name: "CineVision Productions",
      industry: "Media & Entertainment",
      location: "Hyderabad",
    },
    {
      name: "Pixel Motion Studios",
      industry: "Animation & VFX",
      location: "Mumbai",
    },
    {
      name: "Harmony Records",
      industry: "Music Production",
      location: "Pune",
    },
    {
      name: "LensCraft Media",
      industry: "Photography",
      location: "Chennai",
    },
    {
      name: "StarCast Entertainment",
      industry: "Talent Management",
      location: "Bangalore",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Explore Companies
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {company.name.charAt(0)}
              </div>

              <h2 className="text-2xl font-bold">{company.name}</h2>

              <p className="text-gray-600 mt-2">
                🎬 {company.industry}
              </p>

              <p className="text-gray-600">
                📍 {company.location}
              </p>

              <button className="mt-5 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                View Company
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}