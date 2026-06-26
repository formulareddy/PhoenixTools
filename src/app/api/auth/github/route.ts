import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const githubClientId = process.env.GITHUB_CLIENT_ID!
  const redirectUri = `${req.nextUrl.origin}/api/auth/github/callback`

  const params = new URLSearchParams({
    client_id: githubClientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
  })

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  )
}
