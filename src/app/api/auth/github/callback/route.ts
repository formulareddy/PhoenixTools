import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const githubClientId = process.env.GITHUB_CLIENT_ID!
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET!

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const origin = req.nextUrl.origin

  if (!code) {
    return Response.redirect(`${origin}/signin?error=auth_failed`)
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error("[AUTH_GITHUB] Token exchange failed:", tokenData)
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const githubUser = await userRes.json()

    let email = githubUser.email
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      })
      const emails = await emailsRes.json()
      const primaryEmail = emails.find((e: { primary: boolean }) => e.primary)
      if (primaryEmail) {
        email = primaryEmail.email
      }
    }

    if (!email) {
      console.error("[AUTH_GITHUB] No email found for GitHub user:", githubUser.login)
      return Response.redirect(`${origin}/signin?error=no_email`)
    }

    email = email.toLowerCase()
    const username = githubUser.login || email.split("@")[0]
    const avatar = githubUser.avatar_url || null

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
        console.error("[AUTH_GITHUB] Failed to create user:", createError?.message)
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
      console.error("[AUTH_GITHUB] generateLink failed:", linkRes.error)
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    const actionLink = ((linkRes.data as Record<string, unknown>).properties as Record<string, unknown>)?.action_link as string
    if (!actionLink) {
      console.error("[AUTH_GITHUB] No action_link in response:", JSON.stringify(linkRes.data))
      return Response.redirect(`${origin}/signin?error=auth_failed`)
    }

    return Response.redirect(actionLink)
  } catch (err) {
    console.error("[AUTH_GITHUB] OAuth callback error:", err)
    return Response.redirect(`${origin}/signin?error=auth_failed`)
  }
}
