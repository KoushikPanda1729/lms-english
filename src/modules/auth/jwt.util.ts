import { SignJWT, jwtVerify, exportJWK, importPKCS8, importSPKI } from "jose"
import { Config } from "../../config/config"
import { JwtPayload } from "./interfaces/auth.interface"

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  const privateKey = await importPKCS8(Config.PRIVATE_KEY, "RS256")

  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "RS256", kid: Config.JWT_KEY_ID })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Config.JWT_ACCESS_EXPIRY)
    .sign(privateKey)
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const publicKey = await importSPKI(Config.PUBLIC_KEY, "RS256")
  const { payload } = await jwtVerify(token, publicKey)

  return {
    sub: payload.sub as string,
    email: payload["email"] as string,
    role: payload["role"] as string,
  }
}

export async function getJWKS() {
  const publicKey = await importSPKI(Config.PUBLIC_KEY, "RS256")
  const jwk = await exportJWK(publicKey)

  return {
    keys: [
      {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: Config.JWT_KEY_ID,
      },
    ],
  }
}
