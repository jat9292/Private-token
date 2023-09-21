import { NextResponse } from 'next/server'
import path from 'path';
import { promises as fs } from 'fs';

const myFilePath = path.join(__dirname, 'deployed_private_tokens.json');
 
export async function GET() {
  const jsonDirectory = path.join(process.cwd(), 'json');
  //Read the json data file
  const fileContents = await fs.readFile(jsonDirectory + '/deployed_private_tokens.json', 'utf8');
  return NextResponse.json(JSON.parse(fileContents))
}