import React, { useEffect, useRef } from "react"

export interface HistoryEntry {
  id: number
  expression: string
  result: string
  timestamp: number
}

interface HistoryProps {
  history: HistoryEntry[]
  historyIndex: number
  onSelectEntry: (expression: string) => void
  variables: Record<string, number>
  onClearVariables: () => void
  onClearHistory: () => void
}

export function History({ history, historyIndex, onSelectEntry, variables, onClearVariables, onClearHistory }: HistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const selectedEntryRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom (newest entry) when new history entry is added
  useEffect(() => {
    if (history.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
    prevLengthRef.current = history.length
  }, [history])

  // Auto-scroll selected entry into view when navigating with arrows
  useEffect(() => {
    if (historyIndex >= 0 && selectedEntryRef.current) {
      selectedEntryRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [historyIndex])

  const hasVariables = Object.keys(variables).length > 0

  return (
    <div className="flex-1 overflow-y-auto border-r border-[#1a1a1a] flex flex-col">
      {/* Variables Section - Always Sticky */}
      {hasVariables && (
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-[#1a1a1a] z-10">
          <div className="flex items-center justify-between px-4 py-1">
            <div className="relative group">
              <span className="text-[#777] text-sm cursor-help">VARIABLES</span>
              <div className="absolute top-full left-0 mt-1 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#ccc] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
                assign variables with a = [number], e can be assigned but will replace the constant e. x and y are reserved and cannot be assigned
              </div>
            </div>
            <button 
              onClick={onClearVariables}
              className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors"
            >
              CLEAR
            </button>
          </div>
          <div className="px-3 py-2 flex flex-wrap gap-2 border-t border-[#1a1a1a] bg-[#0a0a0a]">
            {Object.entries(variables)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([varName, value]) => (
                <div
                  key={varName}
                  className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      varName === 'e' ? 'text-red-400' : 'text-[#E3E3E3]'
                    }`}>{varName}</span>
                    <span className="text-[#666]">=</span>
                    <span className="text-sm text-green-500 font-medium">{value}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {history.length === 0 && !hasVariables ? (
          <div className="flex items-center justify-center h-full text-[#444] text-xs">NO HISTORY</div>
        ) : history.length > 0 ? (
          <>
            <div className="sticky top-0 bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 py-1 z-10 flex items-center justify-between">
              <span className="text-[#777] text-sm">HISTORY</span>
              {history.length > 0 && (
                <button 
                  onClick={onClearHistory}
                  className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors"
                >
                  CLEAR
                </button>
              )}
            </div>
          <div className="divide-y divide-[#1a1a1a]">
            {history.slice().reverse().map((entry, displayIndex) => {
              const actualIndex = history.length - 1 - displayIndex
              const isSelected = historyIndex === actualIndex
              return (
                <div
                  key={entry.timestamp}
                  ref={isSelected ? selectedEntryRef : null}
                  className={`px-4 py-3 hover:bg-[#0f0f0f] transition-colors cursor-pointer ${
                    isSelected ? "bg-[#1a1a1a] border-l-2 border-l-[#4a9eff]" : ""
                  }`}
                  onClick={() => {
                  // Extract original equation (before arrow) if it exists
                  const originalExpression = entry.expression.includes(' → ') 
                    ? entry.expression.split(' → ')[0] 
                    : entry.expression
                  onSelectEntry(originalExpression)
                }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#666]">ans{entry.id}</span>
                      <span className="text-sm text-[#E3E3E3]">
                        {entry.expression.includes(' → ') ? (
                          <>
                            <span className="text-[#E3E3E3]">{entry.expression.split(' → ')[0]}</span>
                            {entry.expression.split(' → ').slice(1).map((step, index) => (
                              <span key={index}>
                                <span className="text-[#BFDBFF]"> → </span>
                                <span className="text-[#555] font-medium">{step}</span>
                              </span>
                            ))}
                          </>
                        ) : (
                          entry.expression
                        )}
                      </span>
                    </div>
                    <div className={`text-base font-medium ${
                      entry.result === "ERR" ? "text-red-500" : 
                      entry.result === "GRAPH" ? "text-orange-500" :
                      entry.result === "Matt" || entry.result === "https://mattcng.com" ? "text-green-500" :
                      "text-[#4a9eff]"
                    }`}>
                      = {entry.result === "https://mattcng.com" ? (
                        <a 
                          href="https://mattcng.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.result}
                        </a>
                      ) : (
                        entry.result
                      )}
                    </div>
                    </div>
                    <div className="text-xs text-[#444] tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
        ) : null}
      </div>
    </div>
  )
}

