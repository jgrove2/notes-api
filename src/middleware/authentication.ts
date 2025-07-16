import { jwtVerify } from "@kinde-oss/kinde-node-express";
import { KINDE_ISSUER } from "../util/environment.js";

export const authenticationMiddleware = jwtVerify(KINDE_ISSUER, {});
