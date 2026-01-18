export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-lg font-bold text-gray-900">Replay</span>
            <p className="text-sm text-gray-500 mt-1">© 2026 Replay.build. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Twitter</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
