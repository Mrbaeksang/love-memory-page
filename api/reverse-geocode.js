export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
  
    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "Missing lat or lng" }), {
        status: 400,
      });
    }
  
    const url = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&orders=roadaddr,addr&output=json`;
  
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": process.env.VITE_NAVER_API_KEY_ID,
        "X-NCP-APIGW-API-KEY": process.env.VITE_NAVER_API_KEY,
      },
    });
  
    const json = await res.json();
    return new Response(JSON.stringify(json), { status: 200 });
  }
  