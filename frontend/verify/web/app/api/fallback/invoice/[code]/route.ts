import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  // This is a fallback API that will be used if the blockchain API is not available
  // It simulates a successful response from the blockchain for the test code
  if (code === 'INV-T4R7-L9P1') {
    return NextResponse.json({
      hash: '0x7c5ea36004851c764c44143b1dcf59613d3daa99e93b1856774b9a04479d9385',
      hashcode: code,
      issuer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      timestamp: Math.floor(Date.now() / 1000),
      revoked: false,
      completed: false,
      status: 'Submitted'
    });
  }
  
  // Return a "not found" response for any other code
  return NextResponse.json({
    hash: '',
    hashcode: code,
    issuer: '',
    timestamp: 0,
    revoked: false,
    completed: false,
    status: 'Unknown'
  });
} 