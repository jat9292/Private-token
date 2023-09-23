import { NextResponse } from 'next/server'
import path from 'path';
import { promises as fs } from 'fs';
import moment from 'moment';

const myFilePath = path.join(__dirname, 'deployed_private_tokens.json');
 
export async function GET() {
  const jsonDirectory = path.join(process.cwd(), 'json');
  //Read the json data file
  const fileContents = await fs.readFile(jsonDirectory + '/deployed_private_tokens.json', 'utf8');
  return NextResponse.json(JSON.parse(fileContents))
}

export async function POST(req: Request) {
  try {
    let dataObj;
    const data = await req.json();
    const jsonDirectory = path.join(process.cwd(), 'json');
    const fileContents = await fs.readFile(jsonDirectory + '/deployed_private_tokens.json', 'utf8');
    dataObj = JSON.parse(fileContents);
    const utcDate = moment.utc();
    const formattedDate = utcDate.format('MMM-D-YYYY HH:mm:ss +UTC');
    dataObj[data] = formattedDate;
    const updatedContent = JSON.stringify(dataObj, null, 2);
    await fs.writeFile(jsonDirectory + '/deployed_private_tokens.json',updatedContent, 'utf8');
    console.log('Data appended successfully');
  } catch (error) {
      console.error('Error appending JSON to file:', error);
  }
}