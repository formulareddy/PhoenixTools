import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const googleClientId = process.env.GOOGLE_CLIENT_ID!
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const origin = req.nextUrl.origin

  if (!code) {
    return Response.redirect(`${origin}/signin?error=auth_failed`)
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error("[AUTH_GOOGLE] Token exchange failed:", tokenData)
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = await userRes.json()

    if (!googleUser.email) {
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    const email = googleUser.email.toLowerCase()
    const username = googleUser.name || email.split("@")[0]
    const avatar = googleUser.picture || null

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const usersRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } }
    )
    const { users: foundUsers } = await usersRes.json()
    const existingUser = foundUsers?.[0]

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          username,
          avatar_url: avatar,
          full_name: username,
        },
      })
    } else {
      const { data: newUserData, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            username,
            avatar_url: avatar,
            full_name: username,
          },
        })

      if (createError || !newUserData?.user) {
        console.error("[AUTH_GOOGLE] Failed to create user:", createError?.message)
        return Response.redirect(`${origin}/signin?error=auth_failed`)
      }

      userId = newUserData.user.id
    }

    const linkRes = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      redirect_to: `${origin}/dashboard`,
    } as Parameters<typeof adminClient.auth.admin.generateLink>[0])

    if (linkRes.error || !linkRes.data) {
      console.error("[AUTH_GOOGLE] generateLink failed:", linkRes.error)
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    const actionLink = ((linkRes.data as Record<string, unknown>).properties as Record<string, unknown>)?.action_link as string
    if (!actionLink) {
      console.error("[AUTH_GOOGLE] No action_link in response:", JSON.stringify(linkRes.data))
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    return Response.redirect(actionLink)
  } catch (err) {
    console.error("[AUTH_GOOGLE] OAuth callback error:", err)
    return Response.redirect(`${origin}/signin?error=auth_failed`)
  }
}
