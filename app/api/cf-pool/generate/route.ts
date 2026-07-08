import { NextRequest, NextResponse } from 'next/server'
import { CFPoolManager } from '@/lib/cf-pool/pool-manager'
export async function POST(req: NextRequest) {
  const { count } = await req.json()
  return NextResponse.json(await CFPoolManager.getInstance().generateNow(count))
}
