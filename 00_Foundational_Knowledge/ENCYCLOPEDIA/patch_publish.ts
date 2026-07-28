import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');

const oldPublishRegex = /app\.post\("\/api\/github\/publish", async \(req, res\) => \{[\s\S]*?^\}\);/m;
const newPublish = `app.post("/api/github/publish", async (req, res) => {
  const { repoName } = req.body;
  if (!repoName) return res.status(400).json({ error: "Missing repoName" });

  try {
    const octokit = getOctokit();
    
    // Create new repo
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: "Encyclopedia of Engineering compiled via AI Studio",
      private: true,
      auto_init: true
    });

    // Wait a brief moment for the repo to be available
    await new Promise(r => setTimeout(r, 1500));

    const db = loadData();
    const dataContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
    const mdContent = Buffer.from(generateMarkdown(db)).toString('base64');
    
    // Get the authenticated user's login
    const userRes = await octokit.rest.users.getAuthenticated();
    
    // Create the data.json in the new repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: userRes.data.login,
      repo: repoName,
      path: "data.json",
      message: "Initial commit of encyclopedia data",
      content: dataContent
    });

    // Create the ENCYCLOPEDIA.md in the new repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: userRes.data.login,
      repo: repoName,
      path: "ENCYCLOPEDIA.md",
      message: "Initial commit of human-readable encyclopedia index",
      content: mdContent
    });

    res.json({ success: true, url: \`https://github.com/\${userRes.data.login}/\${repoName}\` });
  } catch (error: any) {
    console.error("Publish error:", error);
    res.status(500).json({ error: error.message });
  }
});`;

serverStr = serverStr.replace(oldPublishRegex, newPublish);
fs.writeFileSync('server.ts', serverStr, 'utf-8');
console.log("Updated server.ts publish route");
