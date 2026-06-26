import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID!
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ].join(" ")

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  })

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}