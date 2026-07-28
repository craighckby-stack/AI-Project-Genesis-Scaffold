import React from 'react';
import { motion } from 'framer-motion';

interface NeuralGridProps {
  params: {
    rigidity: number;
    autonomy: number;
    threshold: number;
    friction: number;
  };
}

export const NeuralGrid: React.FC<NeuralGridProps> = ({ params }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(params).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-[9px] uppercase">
            <span className="text-zinc-500">{key}</span>
            <span className="text-zinc-300">{(value as number).toFixed(3)}</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(value as number) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>
      ))}
    </div>
  );
};