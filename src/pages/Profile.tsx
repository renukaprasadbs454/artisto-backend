export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">

        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-purple-600 text-white flex items-center justify-center text-5xl font-bold">
            A
          </div>

          <button className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">
            Upload Profile Photo
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center mt-6">
          Artist Profile
        </h1>

        <form className="space-y-5 mt-8">

          <div>
            <label className="block font-medium mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Profession</label>
            <select className="w-full border rounded-lg p-3">
              <option>Select Profession</option>
              <option>Actor / Actress</option>
              <option>Assistant Director</option>
              <option>Video Editor</option>
              <option>Photographer</option>
              <option>Graphic Designer</option>
              <option>Music Producer</option>
              <option>Voice Artist</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Skills</label>
            <input
              type="text"
              placeholder="Acting, Editing, Photography..."
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Experience</label>
            <textarea
              rows={4}
              placeholder="Tell us about your experience..."
              className="w-full border rounded-lg p-3"
            ></textarea>
          </div>

          <div>
            <label className="block font-medium mb-2">Portfolio Link</label>
            <input
              type="url"
              placeholder="https://yourportfolio.com"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Upload Resume</label>
            <input
              type="file"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
          >
            Save Profile
          </button>

        </form>
      </div>
    </div>
  );
}