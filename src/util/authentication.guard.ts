import { jwtVerify, type JWK, type JWTVerifyOptions, type KeyObject } from "jose"
import type { GezcezJWTPayload } from "../types"
import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { GezcezError } from "../GezcezError"
import { OAuthUtils } from "../../../backend/src/common/utils/oauth.utils"

export function AuthenticationGuard(config: {
	app_key: "inherit" | (string & {})
	override_jwt_config?: {
		secret: CryptoKey | KeyObject | JWK | Uint8Array
		payload: JWTVerifyOptions
	}
	is_inherit?: boolean
	is_use_refresh_token?: boolean
	handleInvalidation?: (
		payload: GezcezJWTPayload,
		context: ExecutionContext
	) => boolean
}) {
	class Guard implements CanActivate {
		async canActivate(context: ExecutionContext) {
			const req = context.switchToHttp().getRequest()
			const token = req.headers.authorization?.split(" ")[1]
			if (!token) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						"Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım. (token undefined)",
				})
			}
			let payload
			if (config.app_key === "inherit") {
				const [_, body, __] = token.split(".")
				const unverified_payload = JSON.parse(await atob(body))
				if (unverified_payload.aud === "oauth")
					throw GezcezError("BAD_REQUEST", {
						__message: `Access tokenler oauth uygulamalarında kullanılamaz..`,
					})
				config.app_key = unverified_payload.aud
				config.is_inherit = true
			}
			if (config.override_jwt_config) {
				const { payload: payload_i } = await jwtVerify(
					token,
					config.override_jwt_config.secret,
					config.override_jwt_config.payload
				)
				payload = payload_i as any as GezcezJWTPayload
			} else {
				payload = await OAuthUtils.verifyJWT(token, config.app_key)
			}
			if (!payload) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						"Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım. (unverified payload)",
				})
			}

			if (config.is_use_refresh_token) {
				if (config.app_key !== "oauth" && !config.is_inherit) {
					throw GezcezError("BAD_REQUEST", {
						__message: `Refresh token'ler sadece oauth key'ine sahip uygulamalarda kullanılabilir.`,
					})
				}
				if (payload.type !== "refresh") {
					throw GezcezError("BAD_REQUEST", {
						__message: `token.type geçersiz ('refresh' beklenirken '${payload.type} bulundu')`,
					})
				}
			} else {
				if (payload.type !== "access") {
					throw GezcezError("BAD_REQUEST", {
						__message: `token.type geçersiz ('access' beklenirken '${payload.type} bulundu')`,
					})
				}
			}
			if (config.handleInvalidation) {
				await config.handleInvalidation(payload, context)
			}
			req["payload"] = payload

			return true
		}
	}
	return Guard
}
