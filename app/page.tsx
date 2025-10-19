"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Graph } from "@/components/Graph"
import { EntrySpace } from "@/components/EntrySpace"
import { History, HistoryEntry } from "@/components/History"

export default function Calculator() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [variables, setVariables] = useState<Record<string, number>>({})

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("calc-history")
    if (saved) {
      const loadedHistory = JSON.parse(saved)
      // Assign IDs to existing entries if they don't have them
      const historyWithIds = loadedHistory.map((entry: any, index: number) => ({
        ...entry,
        id: entry.id || index + 1
      }))
      setHistory(historyWithIds)
    }
  }, [])

  // Load variables from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("calc-variables")
    if (saved) {
      setVariables(JSON.parse(saved))
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("calc-history", JSON.stringify(history))
    }
  }, [history])

  // Save variables to localStorage
  useEffect(() => {
    if (Object.keys(variables).length > 0) {
      localStorage.setItem("calc-variables", JSON.stringify(variables))
    }
  }, [variables])


  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("calc-history")
  }

  const clearVariables = () => {
    setVariables({})
    localStorage.removeItem("calc-variables")
  }

  const showAbout = () => {
    const maxId = history.length > 0 ? Math.max(...history.map(h => h.id)) : 0
    const aboutEntries: HistoryEntry[] = [
      {
        id: maxId + 2,
        expression: "Website",
        result: "https://mattcng.com",
        timestamp: Date.now() + 1,
      },
      {
        id: maxId + 1,
        expression: "Designed by",
        result: "Matt",
        timestamp: Date.now(),
      }
    ]
    setHistory([...aboutEntries, ...history])
  }

  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-[#1a1a1a] px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[#e0e0e0] text-xs">MATTCULATOR</span>
            <span className="text-[#888] text-xs">|</span>
            <span className="text-[#666] text-xs">CALC</span>
            <span className="text-[#888] text-xs">|</span>
            <button onClick={showAbout} className="text-xs text-[#888] hover:text-[#e0e0e0] transition-colors">
              ABOUT
            </button>
            <span className="text-[#888] text-xs">|</span>
            <span className="text-xs text-[#888]">
              [ {history.length} ] {history.length === 1 ? "entry" : "entries"}
            </span>
            {historyIndex >= 0 && (
              <>
                <span className="text-[#888] text-xs">|</span>
                <span className="text-xs text-[#4a9eff]">
                  RECALL [{history.length - historyIndex}/{history.length}]
                </span>
              </>
            )}
          </div>
          {(history.length > 0 || Object.keys(variables).length > 0) && (
            <button onClick={() => { clearHistory(); clearVariables(); }} className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors">
              CLEAR ALL
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex">
          <History history={history} historyIndex={historyIndex} onSelectEntry={setInput} variables={variables} onClearVariables={clearVariables} onClearHistory={clearHistory} />
          <Graph expression={input} variables={variables} />
        </div>

        <EntrySpace
          input={input}
          setInput={setInput}
          history={history}
          setHistory={setHistory}
          historyIndex={historyIndex}
          setHistoryIndex={setHistoryIndex}
          variables={variables}
          setVariables={setVariables}
        />
      </div>
    </div>
  )
}
