'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Eye, EyeOff, CheckCircle, Key } from 'lucide-react';

interface KeyRevealModalProps {
  open: boolean;
  apiKey: string;
  keyName: string;
  onClose: () => void;
}

export default function KeyRevealModal({ open, apiKey, keyName, onClose }: KeyRevealModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEnv = () => {
    const content = `# DMDS API Key — ${keyName}\nDMDS_API_KEY=${apiKey}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.dmds`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setRevealed(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="sm:max-w-[520px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>API Key Created — {keyName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Your newly created API key. Save it now as it will not be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertDescription className="text-sm">
              <span className="font-semibold">Store this key now.</span>{' '}
              For your security, we will not show this secret again. Copy it or download the .env file before closing.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Your API Key</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={revealed ? apiKey : '•'.repeat(Math.min(apiKey.length, 48))}
                  readOnly
                  className="font-mono text-sm bg-muted pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setRevealed(!revealed)}
                  aria-label={revealed ? 'Hide key' : 'Reveal key'}
                >
                  {revealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleDownloadEnv}
            >
              <Download className="mr-2 h-4 w-4" />
              Download .env file
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button size="lg" className="w-full" onClick={handleClose}>
            I've saved my key — Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
