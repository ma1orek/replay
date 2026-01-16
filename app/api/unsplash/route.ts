import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    // Return mock data if no API key
    return NextResponse.json({
      results: generateMockImages(query, parseInt(perPage)),
      total: 100,
      total_pages: 5,
    });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unsplash proxy error:", error);
    // Return mock data on error
    return NextResponse.json({
      results: generateMockImages(query, parseInt(perPage)),
      total: 100,
      total_pages: 5,
    });
  }
}

// Generate mock Unsplash-like images using Picsum with stable IDs
function generateMockImages(query: string, count: number) {
  // Use query hash to generate consistent but varied IDs
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const baseId = hashCode(query) % 500;
  
  return Array.from({ length: count }, (_, i) => {
    // Use stable ID based on query + index
    const id = (baseId + i * 13) % 1000 + 10;
    const width = 800;
    const height = 600;
    
    return {
      id: `mock-${id}-${i}`,
      width,
      height,
      description: `${query} image ${i + 1}`,
      alt_description: `${query} placeholder`,
      urls: {
        // Use stable /id/X/ format
        regular: `https://picsum.photos/id/${id}/${width}/${height}`,
        thumb: `https://picsum.photos/id/${id}/200/200`,
        small: `https://picsum.photos/id/${id}/400/300`,
      },
      user: {
        name: "Picsum Photos",
      },
      links: {
        download_location: `https://picsum.photos/id/${id}/${width}/${height}`,
      },
    };
  });
}
