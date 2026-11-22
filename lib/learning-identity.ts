import { cookies } from "next/headers";
import { getChatGPTUser } from "../app/chatgpt-auth";

// An unguessable, HttpOnly visitor cookie scopes guest work without an account.
// Never accept an account/user identifier from the browser as a guest identity.
export async function getLearningIdentity(request: Request) {
  const account = await getChatGPTUser();
  if (account) return { userId: account.userId, signedIn: true };
  const secure = new URL(request.url).protocol === "https:";
  const name = secure ? "__Host-alfred-visitor" : "alfred-visitor";
  const jar = await cookies();
  let token = jar.get(name)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    jar.set(name, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return { userId: `visitor:${token}`, signedIn: false };
}
