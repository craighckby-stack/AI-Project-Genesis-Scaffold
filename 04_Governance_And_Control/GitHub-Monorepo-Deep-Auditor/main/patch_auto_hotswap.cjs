const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const insertion = `
  useEffect(() => {
    if (emgCoherence >= 100 && !isHotswapping && auditStatus === 'running') {
      handleTriggerHotswap();
    }
  }, [emgCoherence, isHotswapping, auditStatus]);
`;

code = code.replace(
  `  const handleTriggerHotswap = async () => {`,
  `  const handleTriggerHotswap = async () => {`
);

// I'll just append it before the `return (` of the App component.
code = code.replace(
  `  return (`,
  insertion + `\n  return (`
);

fs.writeFileSync('src/App.tsx', code);
