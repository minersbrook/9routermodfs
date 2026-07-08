import { NextResponse } from 'next/server'
import { CFPoolManager } from '@/lib/cf-pool/pool-manager.js'
export async function POST(req) {
  const { count } = await req.json()
  return NextResponse.json(await CFPoolManager.getInstance().generateNow(count))
}
