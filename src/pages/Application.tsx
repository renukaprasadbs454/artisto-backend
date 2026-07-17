export default function Applications() {
  const applications = [
    {
      role: "Assistant Director",
      company: "Dream Studios",
      date: "18 July 2026",
      status: "Shortlisted",
      message:
        "Congratulations! We'd like to invite you for an interview on Monday at 10:00 AM.",
    },
    {
      role: "Video Editor",
      company: "CineVision Productions",
      date: "15 July 2026",
      status: "Under Review",
      message:
        "Your portfolio has been received. Our team is reviewing your application.",
    },
    {
      role: "Photographer",
      company: "LensCraft Media",
      date: "10 July 2026",
      status: "Rejected",
      message:
        "Thank you for your interest. We encourage you to apply again in the future.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Applications</h1>

        <div className="space-y-6">
          {applications.map((app, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">{app.role}</h2>

                  <p className="text-gray-600 mt-2">
                    🏢 {app.company}
                  </p>

                  <p className="text-gray-500">
                    Applied: {app.date}
                  </p>
                </div>

                <div className="mt-4 md:mt-0">
                  <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                  💬 Messages
                </h3>

                <div className="space-y-3">
                  {/* Company */}
                  <div className="flex justify-start">
                    <div className="bg-white shadow rounded-lg p-3 max-w-md">
                      <p className="text-sm font-semibold text-purple-600">
                        {app.company}
                      </p>

                      <p className="text-gray-700">
                        {app.message}
                      </p>
                    </div>
                  </div>

                  {/* User */}
                  <div className="flex justify-end">
                    <div className="bg-purple-600 text-white rounded-lg p-3 max-w-md">
                      <p className="text-sm font-semibold">You</p>

                      <p>
                        Thank you! I will be available for the interview.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border rounded-lg px-4 py-2"
                  />

                  <button className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">
                    Send
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-4">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                  Reply
                </button>

                <button className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700">
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}