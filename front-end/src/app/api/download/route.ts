import { NextResponse } from "next/server";

// Validate purchase and get download URL

const DOWNLOAD_URL =
  "https://celadon-mermaid-ab414e.netlify.app/zine/hodlkombat%20-%20booklet-compressed.pdf";

export async function GET() {
  // This isn't secure right now - anyone can retrieve the download URL if they know what they're doing, even if they haven't purchased the asset.
  // TODO: only provide the download URL if we can verify:
  // 1) The requester's address has successfully purchased the asset (call fundraising.get-purchase-status on-chain)
  // 2) The requester legitimately owns the wallet address (see https://docs.hiro.so/stacks/connect/guides/sign-messages)

  return NextResponse.json({ downloadUrl: DOWNLOAD_URL });
}
