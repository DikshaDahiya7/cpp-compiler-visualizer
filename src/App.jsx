import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, AlertCircle, ArrowRight, Code, 
  Cpu, Layers, Zap, Terminal, FileCode2, Binary, ChevronRight, Settings
} from 'lucide-react';

const PRESETS = {
  basic: `int main() {\n  int a = 10;\n  int b = 20;\n  int sum = a + b;\n  cout << sum;\n  return 0;\n}`,
  constantFolding: `int main() {\n  int x = 5 * 10;\n  int y = x + 20;\n  return y;\n}`,
  syntaxError: `int main() {\n  int a = 10\n  int b = 20;\n  int sum = a + b;\n  return 0;\n}`
};

const PIPELINE_PHASES = [
  { id: 1, name: "Source Code", icon: FileCode2, color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Lexical Analysis", icon: Code, color: "from-emerald-500 to-teal-500" },
  { id: 3, name: "Syntax Analysis", icon: Layers, color: "from-amber-500 to-orange-500" },
  { id: 4, name: "Semantic Analysis", icon: CheckCircle2, color: "from-purple-500 to-violet-500" },
  { id: 5, name: "IR Optimization", icon: Zap, color: "from-pink-500 to-rose-500" },
  { id: 6, name: "Code Generation", icon: Cpu, color: "from-indigo-500 to-blue-600" },
  { id: 7, name: "Assembler & Linker", icon: Binary, color: "from-cyan-500 to-blue-500" }
];

export default function App() {
  const [code, setCode] = useState(PRESETS.basic);
  const [activePhase, setActivePhase] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Phase Processing Logic[cite: 2, 3]
  const analyzeLexical = (src) => {
    const tokenRegex = /[A-Za-z_]\w*|\d+|[+\-*/=;(),{}]|<<|#include\s*<.*?>/g;
    const tokens = src.match(tokenRegex) || [];
    const keywords = ['int', 'float', 'char', 'return', 'using', 'namespace', 'cout', 'main'];
    
    return tokens.map(t => {
      if (keywords.includes(t)) return { text: t, type: 'KEYWORD', bg: 'bg-emerald-950 text-emerald-400 border-emerald-700' };
      if (/^[A-Za-z_]\w*$/.test(t)) return { text: t, type: 'IDENTIFIER', bg: 'bg-blue-950 text-blue-400 border-blue-700' };
      if (/^\d+$/.test(t)) return { text: t, type: 'CONSTANT', bg: 'bg-amber-950 text-amber-400 border-amber-700' };
      return { text: t, type: 'OPERATOR/SEP', bg: 'bg-purple-950 text-purple-400 border-purple-700' };
    });
  };

  const analyzeSyntax = (src) => {
    const errors = [];
    const lines = src.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.startsWith('#')) {
        errors.push(`Line ${idx + 1}: Missing semicolon ';'[cite: 2]`);
      }
    });
    return errors;
  };

  const analyzeSemantic = (src) => {
    const symbols = [];
    const lines = src.split('\n');
    lines.forEach(line => {
      const match = line.match(/(int|float|char)\s+(\w+)\s*=\s*(.+);/);
      if (match) {
        symbols.push({ name: match[2], type: match[1], value: match[3].trim(), scope: 'local' });
      }
    });
    return symbols;
  };

  const generateTAC = (src) => {
    const tac = [];
    const lines = src.split('\n');
    let tCount = 1;
    lines.forEach(line => {
      const exprMatch = line.match(/int\s+(\w+)\s*=\s*(\d+)\s*([+\-*/])\s*(\d+);/);
      if (exprMatch) {
        const [, v, a, op, b] = exprMatch;
        tac.push({ id: `t${tCount}`, code: `t${tCount} = ${a} ${op} ${b}`, orig: `${v} = t${tCount}` });
        tCount++;
      } else {
        const simpleMatch = line.match(/int\s+(\w+)\s*=\s*(.+);/);
        if (simpleMatch) {
          tac.push({ id: simpleMatch[1], code: `${simpleMatch[1]} = ${simpleMatch[2]}` });
        }
      }
    });
    return tac;
  };

  const optimizeTAC = (tacList) => {
    return tacList.map(item => {
      const match = item.code?.match(/(t\d+)\s*=\s*(\d+)\s*([+\-*/])\s*(\d+)/);
      if (match) {
        const [, tVar, a, op, b] = match;
        const res = eval(`${a} ${op} ${b}`);
        return { ...item, optCode: `${tVar} = ${res}`, note: "Constant Folding Optimized" };
      }
      return { ...item, optCode: item.code };
    });
  };

  const generateAssembly = (optTac) => {
    const asm = ["section .text", "global main", "main:", "    PUSH rbp", "    MOV rbp, rsp"];
    optTac.forEach(item => {
      if (item.optCode) {
        const parts = item.optCode.split('=');
        if (parts.length === 2) {
          asm.push(`    MOV ${parts[0].strip ? parts[0].strip() : parts[0].trim()}, ${parts[1].trim()}`);
        }
      }
    });
    asm.push("    POP rbp", "    RET");
    return asm;
  };

  const tokens = analyzeLexical(code);
  const syntaxErrors = analyzeSyntax(code);
  const symbolMap = analyzeSemantic(code);
  const tacData = generateTAC(code);
  const optTacData = optimizeTAC(tacData);
  const asmData = generateAssembly(optTacData);

  useEffect(() => {
    let timer;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setActivePhase(prev => (prev >= 7 ? 1 : prev + 1));
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Cpu className="w-7 h-7 text-cyan-400" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            C++ Compiler Pipeline Visualizer
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold transition ${
              isAutoPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{isAutoPlaying ? 'Pause Pipeline' : 'Auto Play Pipeline'}</span>
          </button>
          <button 
            onClick={() => { setCode(PRESETS.basic); setActivePhase(1); setIsAutoPlaying(false); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Left Side Panel: Source Editor & Presets */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-slate-400 flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span>Source Code (C++)</span>
              </span>
              <div className="flex space-x-2">
                <button onClick={() => setCode(PRESETS.basic)} className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded border border-cyan-900">Basic</button>
                <button onClick={() => setCode(PRESETS.constantFolding)} className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-400 px-2 py-1 rounded border border-purple-900 font-mono">Fold</button>
                <button onClick={() => setCode(PRESETS.syntaxError)} className="text-xs bg-slate-800 hover:bg-slate-700 text-rose-400 px-2 py-1 rounded border border-rose-900">Error</button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-sm p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              placeholder="Write C++ subset code..."
            />
          </div>
        </div>

        {/* Right Side Panel: Interactive Multi-Stage Workflow */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Phase Flow Indicator Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center overflow-x-auto shadow-xl">
            {PIPELINE_PHASES.map((phase) => {
              const Icon = phase.icon;
              const isActive = activePhase === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition min-w-[90px] ${
                    isActive ? 'bg-slate-800 scale-105 border border-cyan-500/50' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${phase.color} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-center">{phase.name}</span>
                </button>
              );
            })}
          </div>

          {/* Phase Content Display Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1 shadow-2xl relative">
            
            {/* Phase 1: Source */}
            {activePhase === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-cyan-400 flex items-center space-x-2">
                  <FileCode2 className="w-5 h-5" />
                  <span>Phase 1: Raw C++ Source Input</span>
                </h2>
                <p className="text-sm text-slate-400">Source code is accepted as input string for parsing.</p>
                <pre className="bg-slate-950 p-4 rounded-lg text-emerald-400 font-mono text-sm border border-slate-800">{code}</pre>
              </div>
            )}

            {/* Phase 2: Lexical Analysis */}
            {activePhase === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Phase 2: Lexical Tokens Stream</span>
                </h2>
                <div className="flex flex-wrap gap-2 max-h-[350px] overflow-y-auto p-2">
                  {tokens.map((tok, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-md border text-xs font-mono flex items-center space-x-2 ${tok.bg}`}>
                      <span className="font-bold">{tok.text}</span>
                      <span className="text-[10px] opacity-60">[{tok.type}]</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 3: Syntax Analysis */}
            {activePhase === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-amber-400 flex items-center space-x-2">
                  <Layers className="w-5 h-5" />
                  <span>Phase 3: Syntax Tree & Validator</span>
                </h2>
                {syntaxErrors.length > 0 ? (
                  <div className="bg-rose-950/50 border border-rose-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-rose-400 font-bold">
                      <AlertCircle className="w-5 h-5" />
                      <span>Syntax Error(s) Found!</span>
                    </div>
                    {syntaxErrors.map((err, i) => (
                      <p key={i} className="text-sm font-mono text-rose-300">{err}</p>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Syntax Verification Passed (Grammar OK)</span>
                    </div>
                    <div className="font-mono text-xs text-slate-300 p-3 bg-slate-950 rounded border border-slate-800">
                      TranslationUnit → FunctionDecl(main) → BlockStmt
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase 4: Semantic Analysis */}
            {activePhase === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-purple-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Phase 4: Semantic Analysis & Symbol Table</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="p-2">Identifier</th>
                        <th className="p-2">Data Type</th>
                        <th className="p-2">Initial Value</th>
                        <th className="p-2">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {symbolMap.map((sym, i) => (
                        <tr key={i} className="hover:bg-slate-800/50">
                          <td className="p-2 text-cyan-400">{sym.name}</td>
                          <td className="p-2 text-purple-400">{sym.type}</td>
                          <td className="p-2 text-amber-400">{sym.value}</td>
                          <td className="p-2 text-slate-400">{sym.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Phase 5: IR Optimization */}
            {activePhase === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-pink-400 flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Phase 5: Intermediate Code & Optimization</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">BEFORE (Three-Address Code)</span>
                    {tacData.map((t, i) => (
                      <p key={i} className="font-mono text-sm text-slate-300 py-1">{t.code}</p>
                    ))}
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-pink-900/50">
                    <span className="text-xs font-semibold text-pink-400 block mb-2">AFTER OPTIMIZATION</span>
                    {optTacData.map((t, i) => (
                      <p key={i} className="font-mono text-sm text-emerald-400 py-1 flex items-center justify-between">
                        <span>{t.optCode}</span>
                        {t.note && <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-1.5 py-0.5 rounded">{t.note}</span>}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 6: Code Generation */}
            {activePhase === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-blue-400 flex items-center space-x-2">
                  <Cpu className="w-5 h-5" />
                  <span>Phase 6: Target Code Generation (x86 Assembly)</span>
                </h2>
                <pre className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-cyan-300 border border-slate-800 max-h-[300px] overflow-y-auto">
                  {asmData.join('\n')}
                </pre>
              </div>
            )}

            {/* Phase 7: Assembler & Linker */}
            {activePhase === 7 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-cyan-400 flex items-center space-x-2">
                  <Binary className="w-5 h-5" />
                  <span>Phase 7: Assembler Output & Binary Stream</span>
                </h2>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-amber-500 space-y-2">
                  <p className="text-slate-500">// Simulated Binary Executable Stream (Machine Code)</p>
                  <p>01001000 01000101 01001100 01001100 01001111</p>
                  <p>01010000 01010101 01010011 01001000 00100000</p>
                  <p className="text-emerald-400 font-bold mt-4">Process exited with status 0 (Execution complete)</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
