import { createFrames } from "frames.js/next";
import { baseUrl } from "../constants";
import { DEFAULT_DEBUGGER_HUB_URL } from "../debug";
import { validateFrameMessage } from "frames.js";
import { FramesMiddleware } from "frames.js/types";

export const basePath = "/frames";

const hubHttpUrl =
  process.env.NODE_ENV === "development"
    ? DEFAULT_DEBUGGER_HUB_URL
    : "https://hubs.airstack.xyz";
const hubRequestOptions =
  process.env.NODE_ENV === "development"
    ? undefined
    : {
        headers: { "x-airstack-hubs": process.env.AIRSTACK_API_KEY! },
      };

interface FrameValidationResult {
  isValid: boolean;
}

const validationMiddleware: FramesMiddleware<
  any,
  { validationResult?: FrameValidationResult }
> = async (ctx, next) => {
  const { request } = ctx;
  if (request.method !== "POST") {
    return next();
  }

  let payload;
  try {
    payload = await request.clone().json();
  } catch (e) {
    return next();
  }

  // ignore message
  const { message, ...validationResult } = await validateFrameMessage(payload, {
    hubHttpUrl,
    hubRequestOptions,
  });

  return next({ validationResult });
};

export const frames = createFrames({
  basePath,
  baseUrl,
  middleware: [validationMiddleware],
});
