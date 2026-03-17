import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) return;
        
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 left-4 h-10 w-10 rounded-full bg-white shadow-md border border-slate-200 text-slate-500 hover:text-indigo-600 z-50"
        onClick={() => setIsOpen(true)}
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <CardTitle className="text-lg flex items-center">
                    <Keyboard className="mr-2 h-5 w-5 text-indigo-500" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-slate-500">Navigation</div>
                    <div></div>
                    
                    <div className="font-medium text-slate-900">Next Paper</div>
                    <div><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">↓</kbd> or <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">j</kbd></div>
                    
                    <div className="font-medium text-slate-900">Previous Paper</div>
                    <div><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">↑</kbd> or <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">k</kbd></div>
                    
                    <div className="font-medium text-slate-900">Open Paper Details</div>
                    <div><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Enter</kbd></div>
                    
                    <div className="text-slate-500 mt-2">Actions</div>
                    <div></div>
                    
                    <div className="font-medium text-slate-900">Toggle Star</div>
                    <div><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">s</kbd></div>
                    
                    <div className="font-medium text-slate-900">Show Shortcuts</div>
                    <div><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">?</kbd></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
