'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldAlert, Cpu, Activity, AlertCircle } from 'lucide-react';

interface FormattedResponseProps {
  content: string;
}

export function FormattedResponse({ content }: FormattedResponseProps) {
  // If content is empty
  if (!content) return null;

  // Split into blocks by lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const dataRows = tableRows.slice(1).filter(r => !r.every(c => c.trim().match(/^-+$/)));

    elements.push(
      <div key={key} className="overflow-x-auto my-3 rounded-lg border border-[#24385E] bg-[#0A101D]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#24385E] bg-[#0E172B]">
              {header.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                  {renderInlineMarkdown(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D2C4A]">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-200 font-mono text-[11px]">
                    {renderInlineMarkdown(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code Block start / end
    if (trimmed.startsWith('```')) {
      if (inTable) flushTable(`table-${i}`);
      if (inCodeBlock) {
        // End code block
        elements.push(
          <CodeSnippetBlock
            key={`code-${i}`}
            code={codeBlockLines.join('\n')}
            language={codeBlockLang}
          />
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 2. Table row detection (| col | col |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    // 3. Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(
        <div key={`hr-${i}`} className="my-3 border-t border-[#1F3154] relative">
          <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-8 h-1 bg-cyan-500/20 rounded-full" />
        </div>
      );
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs font-bold text-cyan-300 uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1.5">
          <Activity size={12} className="text-cyan-400 shrink-0" />
          <span>{renderInlineMarkdown(trimmed.slice(5))}</span>
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <div key={`h3-${i}`} className="mt-4 mb-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-cyan-500/5 to-transparent border-l-2 border-cyan-400 pl-3">
          <h3 className="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
            <Cpu size={14} className="text-cyan-400 shrink-0" />
            <span>{renderInlineMarkdown(trimmed.slice(4))}</span>
          </h3>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-bold text-white tracking-tight mt-3 mb-2 flex items-center gap-2 border-b border-[#24385E] pb-1">
          <Terminal size={14} className="text-purple-400" />
          <span>{renderInlineMarkdown(headingText)}</span>
        </h2>
      );
      continue;
    }

    // 5. Ordered List item (e.g. "1. ", "2. ")
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const num = orderedMatch[1];
      const itemContent = orderedMatch[2];
      elements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <div className="flex-1 text-slate-200 leading-relaxed text-xs">
            {renderInlineMarkdown(itemContent)}
          </div>
        </div>
      );
      continue;
    }

    // 6. Unordered List item (e.g. "- ", "* ")
    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      const itemContent = unorderedMatch[1];
      elements.push(
        <div key={`ul-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2 shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
          <div className="flex-1 text-slate-200 leading-relaxed text-xs">
            {renderInlineMarkdown(itemContent)}
          </div>
        </div>
      );
      continue;
    }

    // 7. Empty line spacer
    if (trimmed === '') {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // 8. Regular paragraph line
    elements.push(
      <p key={`p-${i}`} className="text-slate-200 leading-relaxed text-xs my-1">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  if (inTable) flushTable('table-end');

  return (
    <div className="space-y-1 text-xs font-normal">
      {elements}
    </div>
  );
}

// Inline Markdown Parser: handles bold, code, badges, severity tags
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split tokens by bold **text** or inline `code`
  // Regex matches: `code` or **bold**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-[#131D33] border border-cyan-500/30 text-cyan-300 font-mono text-[11px] inline-block tracking-wide shadow-xs"
        >
          {codeContent}
        </code>
      );
    }

    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      const upper = inner.toUpperCase().trim();

      // Check for severity keywords to render special NOC badges
      if (upper === 'CRITICAL') {
        return (
          <span
            key={index}
            className="mx-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold text-[10px] inline-flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
          >
            <ShieldAlert size={10} className="text-rose-400" />
            CRITICAL
          </span>
        );
      }
      if (upper === 'MAJOR') {
        return (
          <span
            key={index}
            className="mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[10px] inline-flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          >
            <AlertCircle size={10} className="text-amber-400" />
            MAJOR
          </span>
        );
      }
      if (upper === 'MINOR') {
        return (
          <span
            key={index}
            className="mx-0.5 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-mono font-bold text-[10px]"
          >
            MINOR
          </span>
        );
      }
      if (upper === 'DEGRADED') {
        return (
          <span
            key={index}
            className="mx-0.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-bold text-[10px]"
          >
            DEGRADED
          </span>
        );
      }

      return (
        <strong key={index} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

// Code Block with Copy Button
function CodeSnippetBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-lg border border-[#24385E] bg-[#070C18] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0C152B] border-b border-[#1E2E4E] text-[10px] font-mono text-slate-400">
        <span className="uppercase text-cyan-400 tracking-wider font-semibold">
          {language || 'TELEMETRY / COMMAND'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          title="Copy snippet"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
