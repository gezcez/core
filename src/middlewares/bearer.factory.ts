import { UseBearerAuthentication, type IAuthenticationGuardConfig } from "./bearer.decorator";

export function BuildBearerDecorator(config:IAuthenticationGuardConfig) {
   return UseBearerAuthentication(config)
}