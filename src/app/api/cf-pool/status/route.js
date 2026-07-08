import { NextResponse } from 'next/server'
import { CFPoolManager } from '@/lib/cf-pool/pool-manager.js'
export async function GET() { return NextResponse.json(CFPoolManager.getInstance().status) }
