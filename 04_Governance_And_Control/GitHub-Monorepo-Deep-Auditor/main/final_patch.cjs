const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Persist token
code = code.replace(
  `const [token, setToken] = useState("");`,
  `const [token, setToken] = useState(() => localStorage.getItem("GH_TOKEN") || "");
  useEffect(() => {
    localStorage.setItem("GH_TOKEN", token);
  }, [token]);`
);

// 2. Modify handleTriggerHotswap
code = code.replace(
  `      await onApplyEnhancement(filePath, content);
      addLog("✅ Hot-patch applied. Rebooting cognitive grid...", "success");

    } catch (err: any) {`,
  `      await onApplyEnhancement(filePath, content);
      addLog("✅ Hot-patch applied. Rebooting cognitive grid...", "success");
      saveStateToStorage();
      localStorage.setItem('HOTSWAP_AUTO_RESUME', 'true');
    } catch (err: any) {`
);

// 3. Auto resume on mount
code = code.replace(
  `    if (localStorage.getItem(STATE_KEY)) {
      setHasSavedState(true);
    }
  }, []);`,
  `    if (localStorage.getItem(STATE_KEY)) {
      setHasSavedState(true);
    }
    
    // Auto-resume after hotswap
    if (localStorage.getItem('HOTSWAP_AUTO_RESUME') === 'true') {
      localStorage.removeItem('HOTSWAP_AUTO_RESUME');
      // Use setTimeout to ensure state is fully initialized
      setTimeout(() => {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
          try {
            const state = JSON.parse(saved);
            // We manually set state to simulate loadSavedState inside this effect
            setHasSavedState(true);
            if (state.auditStatus === 'running') {
              // We need to trigger the resume
              window.dispatchEvent(new Event('trigger-auto-resume'));
            }
          } catch(e){}
        }
      }, 500);
    }
  }, []);`
);

// We need to add the event listener to trigger resume since loadSavedState and startAudit are defined after
code = code.replace(
  `  const startAudit = async (resume = false) => {`,
  `  useEffect(() => {
    const handleAutoResume = () => {
      loadSavedState();
      setTimeout(() => {
        startAudit(true);
      }, 100);
    };
    window.addEventListener('trigger-auto-resume', handleAutoResume);
    return () => window.removeEventListener('trigger-auto-resume', handleAutoResume);
  }, [token]);

  const startAudit = async (resume = false) => {`
);

fs.writeFileSync('src/App.tsx', code);
