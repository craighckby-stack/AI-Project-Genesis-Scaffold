import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

interface CommittableFile {
  path: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, owner, repo, branch, files, commitMessage } = body;

    if (!token || !owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'All connection fields are required: token, owner, repo, branch.' },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided for bulk committing. Collect approved mutations first.' },
        { status: 400 }
      );
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // ────────────────────────────────────────────────────────
    // STEP A: Get latest reference SHA (latest commit)
    // ────────────────────────────────────────────────────────
const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
    const refRes = await fetch(refUrl, { headers });

    if (!refRes.ok) {
      const err = await refRes.text();
      return NextResponse.json(
        { error: `Could not fetch branch ref: ${err}` },
        { status: refRes.status }
      );
    }

    const refData = await refRes.json();
    const latestCommitSha = refData.object?.sha;

    if (!latestCommitSha) {
      return NextResponse.json(
        { error: 'Could not resolve latest commit SHA from branch.' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────
    // STEP B: Get base commit's tree SHA
    // ────────────────────────────────────────────────────────
const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
    const commitRes = await fetch(commitUrl, { headers });

    if (!commitRes.ok) {
      const err = await commitRes.text();
      return NextResponse.json(
        { error: `Could not fetch commit details: ${err}` },
        { status: commitRes.status }
      );
    }

    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree?.sha;

    if (!baseTreeSha) {
      return NextResponse.json(
        { error: 'Could not resolve base tree SHA.' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────
    // STEP C: Create a new tree with modified files
    // ────────────────────────────────────────────────────────
const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
    
    // Construct the tree objects array
    const treeItems = files.map((file: CommittableFile) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    const treeRes = await fetch(treeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!treeRes.ok) {
      const err = await treeRes.text();
      return NextResponse.json(
        { error: `Could not create dynamic tree: ${err}` },
        { status: treeRes.status }
      );
    }

    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    if (!newTreeSha) {
      return NextResponse.json(
        { error: 'Could not create new tree SHA.' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────
    // STEP D: Create a commit pointing to the new tree and base commit
    // ────────────────────────────────────────────────────────
const createCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
    
    const defaultMsg = `[DARLEK CANN] Bulk Commit: Staged system evolution of ${files.length} file${files.length > 1 ? 's' : ''}`;
    const commitBody = {
      message: commitMessage || defaultMsg,
      tree: newTreeSha,
      parents: [latestCommitSha],
    };

    const createCommitRes = await fetch(createCommitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitBody),
    });

    if (!createCommitRes.ok) {
      const err = await createCommitRes.text();
      return NextResponse.json(
        { error: `Could not create commit resource: ${err}` },
        { status: createCommitRes.status }
      );
    }

    const createCommitData = await createCommitRes.json();
    const newCommitSha = createCommitData.sha;

    if (!newCommitSha) {
      return NextResponse.json(
        { error: 'Could not create commit.' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────
    // STEP E: Update branch reference to point to new commit
    // ────────────────────────────────────────────────────────
const updateRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`;
    
    const updateRefRes = await fetch(updateRefUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefRes.ok) {
      const err = await updateRefRes.text();
      return NextResponse.json(
        { error: `Could not direct branch head reference: ${err}` },
        { status: updateRefRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      commitSha: newCommitSha,
      filesCommitted: files.length,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
    });
  } catch (error) {
    console.error('Bulk commit API crash:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown exception';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}






