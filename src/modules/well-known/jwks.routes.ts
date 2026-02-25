import { Router } from "express"
import { getJWKS } from "../auth/jwt.util"

export function jwksRouter(): Router {
  const router = Router()

  router.get("/jwks.json", async (_req, res, next) => {
    try {
      const jwks = await getJWKS()
      res.json(jwks)
    } catch (err) {
      next(err)
    }
  })

  return router
}
