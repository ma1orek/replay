export function VisualProof() {
  const styles = [
    "SaaS Dashboard",
    "Mobile App", 
    "Landing Page",
    "E-commerce Store",
    "Admin Panel",
    "User Profile",
    "Settings Page",
    "Kanban Board"
  ];

  return (
    <section className="bg-white py-24 border-y border-gray-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Any style you need.
        </h2>
        <p className="mt-4 text-gray-600">
          Replay adapts to your design system.
        </p>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee whitespace-nowrap flex gap-8 py-4">
          {styles.concat(styles).map((style, index) => (
            <div 
              key={index}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-8 py-4 text-lg font-medium text-gray-600 shadow-sm"
            >
              {style}
            </div>
          ))}
        </div>
        
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </section>
  );
}
