import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const projectRoot = process.cwd();

    // Create system folders
    const foldersToCreate = [
      'src/core',
      'src/types',
      'src/hooks',
      'src/components',
      'src/lib',
      'src/utils',
      'src/services'
    ];

    const results = [];
    for (const folder of foldersToCreate) {
      const fullPath = path.join(projectRoot, folder);
      await fs.mkdir(fullPath, { recursive: true });
      results.push(`Created directory: ${folder}`);
    }

    // Write some base files
    await fs.writeFile(
      path.join(projectRoot, 'src/types/index.ts'),
      '// Core types definitions\nexport {};\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(projectRoot, 'src/core/index.ts'),
      '// Core logic\nexport {};\n',
      'utf8'
    );
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Scaffold error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
