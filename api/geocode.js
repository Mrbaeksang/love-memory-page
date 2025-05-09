export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
  
    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
    }
  
    const res = await fetch(`https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": process.env.VITE_NAVER_API_KEY_ID,
        "X-NCP-APIGW-API-KEY": process.env.VITE_NAVER_API_KEY,
      },
    });
  
    const json = await res.json();
    return new Response(JSON.stringify(json), { status: 200 });
  }
  