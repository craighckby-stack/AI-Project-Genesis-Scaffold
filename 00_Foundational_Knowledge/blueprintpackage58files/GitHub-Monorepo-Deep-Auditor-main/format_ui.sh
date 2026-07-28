#!/bin/bash
# Remove background colors and make it black/white in App.tsx and Console.tsx
sed -i 's/bg-\[#[0-9a-fA-F]*\]/bg-black/g' src/App.tsx src/components/Console.tsx
sed -i 's/bg-slate-900/bg-black/g' src/App.tsx src/components/Console.tsx
sed -i 's/text-slate-300/text-white/g' src/App.tsx src/components/Console.tsx
sed -i 's/text-slate-400/text-gray-300/g' src/App.tsx src/components/Console.tsx
sed -i 's/text-slate-500/text-gray-400/g' src/App.tsx src/components/Console.tsx
sed -i 's/border-\[#[0-9a-fA-F]*\]/border-white\/20/g' src/App.tsx src/components/Console.tsx
