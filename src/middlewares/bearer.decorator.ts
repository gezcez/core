import {
	applyDecorators,
	UseGuards,
	type CanActivate,
	type ExecutionContext
} from "@nestjs/common"
import { ApiHeader, ApiParam } from "@nestjs/swagger"

export type IAuthenticationGuardConfig = {
	aud: string
	issuer: string
	secret: string
	form_based?: boolean
}
import type { Request } from "express"
import { PATH_METADATA } from "@nestjs/common/constants"
import type { GezcezJWTPayload, InternalGezcezJWTPayload } from "../types"
import { GezcezError } from "../GezcezError"
import { jwtVerify, type JWK, type KeyObject } from "jose"

export function BuildAuthenticationGuard(config: IAuthenticationGuardConfig) {
	return class AuthorizationGuardInner implements CanActivate {
		async canActivate(context: ExecutionContext) {
			const handler = context.getHandler()
			const controller = context.getClass()

			const methodPath = Reflect.getMetadata(PATH_METADATA, handler) || ""
			const controllerPath =
				Reflect.getMetadata(PATH_METADATA, controller) || ""

			const req = context.switchToHttp().getRequest() as Request
			let token
			if (config.form_based) {
				token = req.headers.authorization?.split(" ")[1] || (req.query.token as string)?.split(" ")[1] || (req.body?.token)?.split(" ")[1]
			} else {
				token = req.headers.authorization?.split(" ")[1]
			}
			if (!token) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						`Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım. (token undefined)`
				})
			}
			const payload = await verifyJWT({
				aud: config.aud,
				issuer: config.issuer,
				secret: new TextEncoder().encode(config.secret),
				token: token
			})
			if (!payload) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						`Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım. (payload undefined/${!!config.form_based})`
				})
			}
			if (!["device", "internal-token"].includes(((payload).type) ||"invalid"))
				throw GezcezError("BAD_REQUEST", {
					__message: `token.type geçersiz ('internal-token' beklenirken '${payload.type} bulundu')`
				})
			req["payload"] = payload as any
			return true
		}
	}
}

async function verifyJWT(
	args: Omit<IAuthenticationGuardConfig, "secret"> & {
		token: string
		secret: CryptoKey | KeyObject | JWK | Uint8Array
	}
) {
	const { secret, token, aud, issuer } = args
	let payload
	try {
		payload = (
			await jwtVerify(token, secret, {
				issuer: issuer,
				audience: aud
			})
		).payload
	} catch (e) {
		// console.error("JWT verification failed:", e)
		return
	}
	if (!payload) return

	return {
		...payload
	} as InternalGezcezJWTPayload
}
