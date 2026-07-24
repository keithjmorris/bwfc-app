export async function GET() {
  return Response.json({
    hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasFootballKey: !!process.env.FOOTBALL_DATA_API_KEY,
  });
}