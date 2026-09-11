import {NextResponse} from 'next/server';export async function GET(){return NextResponse.json({ok:true,service:'The Venue Search API',time:new Date().toISOString()})}
