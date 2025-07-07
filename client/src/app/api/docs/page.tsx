import Card from "../../../../components/card";

export const metadata = {
  title: "API | Nomalos",
};

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
        <Card className="w-full mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-[#60a5fa]">Nomalos Public API</h1>
          <p className="text-gray-200 mb-4">
            Welcome to the Nomalos public API! All endpoints are available at:<br />
            <span className="font-mono text-blue-300">https://comingsoon.com/api/</span>
          </p>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication</h2>
          <p className="text-gray-300 mb-2">
            All endpoints require authentication. To properly authenticate, include your API key in the <span className="font-mono bg-[#232323] px-2 py-1 rounded">Authorization</span> header:
          </p>
          <pre className="bg-[#232323] text-blue-200 rounded p-3 mb-2 text-xs break-words">
Authorization: Bearer &#123;your_token_here&#125;
          </pre>
          <p className="text-gray-400 text-sm">
            You can obtain a token by logging in via the website.
          </p>
        </Card>

        {/* Endpoints */}
        <div className="w-full flex flex-col gap-6 mb-16 max-w-2xl mx-auto px-0">
          {/* Games Endpoint */}
          <Card>
            <h3 className="text-lg font-bold text-blue-400 mb-1">GET /api/games</h3>
            <p className="text-gray-300 mb-1">Retrieve a list of all active games.</p>
            <div className="mb-1">
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">GET</span>
              <span className="font-mono text-blue-200">/api/games</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Returns:</p>
            <pre className="bg-[#232323] text-gray-200 rounded p-3 mb-2 text-xs break-words">
{`[
  {
    "id": "string",
    "players": ["userId1", "userId2"],
    "createdAt": "ISODate",
    "timing": "short" | "long",
    "rated": true,
    ...
  }
]`}
            </pre>
          </Card>

          {/* Archive Endpoint */}
          <Card>
            <h3 className="text-lg font-bold text-blue-400 mb-1">GET /api/archive</h3>
            <p className="text-gray-300 mb-1">Retrieve a list of completed (archived) games.</p>
            <div className="mb-1">
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">GET</span>
              <span className="font-mono text-blue-200">/api/archive</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Returns:</p>
            <pre className="bg-[#232323] text-gray-200 rounded p-3 mb-2 text-xs break-words">
{`[
  {
    "id": "string",
    "players": ["userId1", "userId2"],
    "winner": "userId1",
    "createdAt": "ISODate",
    "endedAt": "ISODate",
    ...
  }
]`}
            </pre>
          </Card>

          {/* User Endpoint */}
          <Card>
            <h3 className="text-lg font-bold text-blue-400 mb-1">GET /api/user/&lt;username&gt;</h3>
            <p className="text-gray-300 mb-1">Retrieve public profile information for a user.</p>
            <div className="mb-1">
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">GET</span>
              <span className="font-mono text-blue-200">/api/user/&lt;username&gt;</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Returns:</p>
            <pre className="bg-[#232323] text-gray-200 rounded p-3 mb-2 text-xs break-words">
{`{
  "id": "string",
  "username": "string",
  "shortRating": 1200,
  "longRating": 1200,
  "createdAt": "ISODate",
  ...
}`}
            </pre>
          </Card>

          {/* User Games Endpoint */}
          <Card>
            <h3 className="text-lg font-bold text-blue-400 mb-1">GET /api/user/games/&lt;userId&gt;</h3>
            <p className="text-gray-300 mb-1">Retrieve all games (active and archived) for a specific user.</p>
            <div className="mb-1">
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">GET</span>
              <span className="font-mono text-blue-200">/api/user/games/&lt;userId&gt;</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Returns:</p>
            <pre className="bg-[#232323] text-gray-200 rounded p-3 mb-2 text-xs break-words">
{`[
  {
    "id": "string",
    "players": ["userId1", "userId2"],
    "timing": "short" | "long",
    "rated": true,
    "winner": "userId1" | null,
    ...
  }
]`}
            </pre>
          </Card>
        </div>
      </main>
    </div>
  );
}