import { basePath, frames } from "../../../frames/frames";
import { baseUrl } from "../../../constants";
import { NextRequest } from "next/server";

interface Params {
  actionType: string;
}

export const GET = async (req: NextRequest, { params }: { params: Params }) => {
  const actionName = params.actionType === "allowance" ? "allowance" : "stats";
  const actionMetadata = {
    action: {
      type: "post",
    },
    icon: "graph",
    name: `$DEGEN ${actionName}`,
    aboutUrl: baseUrl,
    description: `Checks the $DEGEN ${actionName} of the caster and returns a frame.`,
  };

  return Response.json(actionMetadata);
};

export const POST = frames(async (ctx) => {
  // extract last segment of the pathname
  const actionType = ctx.url.pathname.split("/").pop();
  const frameUrl = new URL(basePath, baseUrl);
  if (actionType === "allowance") {
    frameUrl.searchParams.set("p", "/allowance");
  }
  frameUrl.searchParams.set("ca", "1");
  return Response.json({
    type: "frame",
    frameUrl: frameUrl.toString(),
  });
});
