export default function Opportunities() {
  const opportunities = [
    {
      title: "Assistant Director",
      company: "Dream Studios",
      location: "Bangalore",
      type: "Full-Time",
    },
    {
      title: "Video Editor",
      company: "CineVision Productions",
      location: "Hyderabad",
      type: "Freelance",
    },
    {
      title: "Photographer",
      company: "LensCraft Media",
      location: "Chennai",
      type: "Contract",
    },
    {
      title: "Graphic Designer",
      company: "Pixel Motion Studios",
      location: "Mumbai",
      type: "Full-Time",
    },
    {
      title: "Music Producer",
      company: "Harmony Records",
      location: "Pune",
      type: "Part-Time",
    },
    {
      title: "Actor / Actress",
      company: "StarCast Entertainment",
      location: "Bangalore",
      type: "Audition",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Explore Opportunities
        </h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search opportunities..."
            className="flex-1 p-3 border rounded-lg"
          />

          <select className="p-3 border rounded-lg">
            <option>All Locations</option>
            <option>Bangalore</option>
            <option>Hyderabad</option>
            <option>Mumbai</option>
            <option>Chennai</option>
            <option>Pune</option>
          </select>

          <button className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700">
            Search
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((job, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
            >
              <h2 className="text-2xl font-bold">{job.title}</h2>

              <p className="text-gray-600 mt-2">
                🏢 {job.company}
              </p>

              <p className="text-gray-600">
                📍 {job.location}
              </p>

              <p className="text-gray-500 mt-2">
                {job.type}
              </p>

              <button className="mt-5 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}