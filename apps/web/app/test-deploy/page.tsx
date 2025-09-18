export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Vercel Deploy Test
        </h1>
        <p className="text-gray-700 mb-4">
          Se você está vendo esta página, o deploy funcionou!
        </p>
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-blue-800 text-sm">
            Build Time: {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  )
}