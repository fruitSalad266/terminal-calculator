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
}

export function History({ history, historyIndex, onSelectEntry }: HistoryProps) {
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

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto border-r border-[#1a1a1a]">
      {history.length === 0 ? (
        <div className="flex items-center justify-center h-full text-[#444] text-xs">NO HISTORY</div>
      ) : (
        <>
          <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-1 z-10">
            <span className="text-[#777] text-sm">HISTORY</span>
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
      )}
    </div>
  )
}

