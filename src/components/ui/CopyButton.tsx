import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
    value: string;
    className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "h-6 w-6 text-foreground/50 hover:text-secondary hover:bg-secondary/10 transition-all",
                className
            )}
            onClick={handleCopy}
            title="Copiar para área de transferência"
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
            ) : (
                <Copy className="w-3.5 h-3.5" />
            )}
            {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 uppercase font-bold tracking-wider">
                    Copiado!
                </span>
            )}
        </Button>
    );
}
