export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Welcome Section */}
        <div className="bg-purple-600 text-white rounded-xl p-6 mb-8">
          <h1 className="text-3xl font-bold">
            Welcome Back 👋
          </h1>
          <p className="mt-2">
            Discover new creative opportunities and manage your profile.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6">

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-4xl font-bold text-purple-600">12</h2>
            <p className="mt-2 text-gray-600">Applications</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-4xl font-bold text-green-600">8</h2>
            <p className="mt-2 text-gray-600">Saved Jobs</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-4xl font-bold text-blue-600">5</h2>
            <p className="mt-2 text-gray-600">Messages</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-4xl font-bold text-red-600">3</h2>
            <p className="mt-2 text-gray-600">Notifications</p>
          </div>

        </div>

        {/* Recommended Opportunities */}
        <div className="mt-10">
          <h2 className="text-3xl font-bold mb-6">
            Recommended Opportunities
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold">
                🎬 Assistant Director
              </h3>
              <p className="mt-2 text-gray-600">
                Dream Studios
              </p>
              <button className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">
                View Details
              </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold">
                🎥 Video Editor
              </h3>
              <p className="mt-2 text-gray-600">
                CineVision Productions
              </p>
              <button className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">
                View Details
              </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold">
                📸 Photographer
              </h3>
              <p className="mt-2 text-gray-600">
                LensCraft Media
              </p>
              <button className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">
                View Details
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}