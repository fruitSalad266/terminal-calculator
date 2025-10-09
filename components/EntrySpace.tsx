"use client"

import { useEffect, useRef } from "react"
import { evaluate } from "mathjs"

interface HistoryEntry {
  id: number
  expression: string
  result: string
  timestamp: number
}

interface EntrySpaceProps {
  input: string
  setInput: (value: string) => void
  history: HistoryEntry[]
  setHistory: (history: HistoryEntry[]) => void
  historyIndex: number
  setHistoryIndex: (index: number) => void
}

export function EntrySpace({
  input,
  setInput,
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
}: EntrySpaceProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input immediately on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep input focused
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus()
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const isGraphEquation = (expr: string): boolean => {
    const lower = expr.toLowerCase().trim()
    return (
      lower.includes("sin") ||
      lower.includes("cos") ||
      lower.includes("tan") ||
      lower.includes("y=") ||
      lower.includes("y =") ||
      lower.match(/\b[xy]\b/) !== null
    )
  }

  const replaceAnswerReferences = (expr: string): string => {
    let result = expr

    // Replace ans with most recent result (highest ID)
    if (history.length > 0) {
      const mostRecentEntry = history.reduce((latest, entry) =>
        entry.id > latest.id ? entry : latest
      )
      result = result.replace(/\bans\b/g, mostRecentEntry.result)

      // Replace ans1, ans2, ans3, etc. with historical results by ID
      for (const entry of history) {
        const pattern = new RegExp(`\\bans${entry.id}\\b`, "g")
        result = result.replace(pattern, entry.result)
      }
    }

    return result
  }

  // Calculate preview result
  const getPreview = (): { value: string; type: "normal" | "error" | "graph" } => {
    if (!input.trim()) return { value: "", type: "normal" }
    
    // Check if it's a graph equation
    if (isGraphEquation(input)) {
      return { value: "GRAPH", type: "graph" }
    }
    
    try {
      const processedInput = replaceAnswerReferences(input)
      const result = evaluate(processedInput)
      
      // Don't show preview for functions or other non-numeric results
      if (typeof result === 'function' || typeof result === 'object') {
        return { value: "", type: "normal" }
      }
      
      return { value: String(result), type: "normal" }
    } catch {
      return { value: "ERR", type: "error" }
    }
  }

  const getIntermediateExpression = (expr: string): string => {
    try {
      const processedInput = replaceAnswerReferences(expr)
      let currentExpr = processedInput
      const steps: string[] = []
      
      // Keep evaluating until no more parentheses can be simplified
      while (currentExpr.includes('(') && currentExpr.includes(')')) {
        const parenRegex = /\(([^()]+)\)/g
        let match
        let hasChanges = false
        
        while ((match = parenRegex.exec(currentExpr)) !== null) {
          try {
            const innerExpr = match[1]
            const innerResult = evaluate(innerExpr)
            if (typeof innerResult === 'number' && isFinite(innerResult)) {
              const newExpr = currentExpr.replace(match[0], String(innerResult))
              if (newExpr !== currentExpr) {
                steps.push(newExpr)
                currentExpr = newExpr
                hasChanges = true
                break // Only do one replacement at a time
              }
            }
          } catch (e) {
            // Skip invalid inner expressions
          }
        }
        
        if (!hasChanges) break
      }
      
      // Join all steps with arrows
      return steps.length > 0 ? steps.join(' → ') : ""
    } catch {
      return ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (input.trim()) {
        let resultValue: string
        let intermediateExpr: string = ""
        
        // Check if it's a graph equation
        if (isGraphEquation(input)) {
          resultValue = "GRAPH"
        } else {
          try {
            const processedInput = replaceAnswerReferences(input)
            const result = evaluate(processedInput)
            resultValue = String(result)
            
            // Get intermediate expression for parentheses expressions
            intermediateExpr = getIntermediateExpression(input)
          } catch (error) {
            // Invalid expression - store as ERR
            resultValue = "ERR"
          }
        }

        // Generate unique ID for the new entry
        const maxId = history.length > 0 ? Math.max(...history.map(h => h.id)) : 0
        
        // Create expression with progression if there are intermediate steps
        let displayExpression = input
        if (intermediateExpr && intermediateExpr !== input) {
          displayExpression = `${input} → ${intermediateExpr}`
        }
        
        const entry: HistoryEntry = {
          id: maxId + 1,
          expression: displayExpression,
          result: resultValue,
          timestamp: Date.now(),
        }
        
        setHistory([entry, ...history].slice(0, 100))
        setInput("")
        setHistoryIndex(-1)
      }
    } else if (e.key === "Escape") {
      setInput("")
      setHistoryIndex(-1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(newIndex)
        const expression = history[newIndex].expression
        // Extract original equation (before arrow) if it exists
        const originalExpression = expression.includes(' → ') 
          ? expression.split(' → ')[0] 
          : expression
        setInput(originalExpression)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        const expression = history[newIndex].expression
        // Extract original equation (before arrow) if it exists
        const originalExpression = expression.includes(' → ') 
          ? expression.split(' → ')[0] 
          : expression
        setInput(originalExpression)
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    } else {
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
        setHistoryIndex(-1)
      }
    }
  }

  const preview = getPreview()

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0f0f0f]">
      <div className="border-b border-[#1a1a1a] px-4 py-1">
          <span className="text-[#777] text-sm">EQUATION BOX</span>
      </div>
      <div className="px-6 py-6">
        <div className="flex items-center gap-4">
          <span className="text-[#4a9eff] text-3xl">›</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-4xl tracking-wide"
            placeholder="type expression..."
            autoFocus
          />
          {preview.value && (
            <div className="flex items-center gap-3 text-[#666] text-3xl">
              <span>=</span>
              <span className={`font-medium ${
                preview.type === "error" ? "text-red-500" : 
                preview.type === "graph" ? "text-orange-500" : 
                "text-[#4a9eff]"
              }`}>
                {preview.value}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 text-xs text-[#666] flex gap-4 border-t border-[#1a1a1a] pt-2">
        <span>ENTER=eval</span>
        <span>ESC=clear</span>
        <span>↑↓=recall</span>
        <span className="text-[#444]">|</span>
        <span>ans ans1 ans2=previous results</span>
        <span className="text-[#444]">|</span>
        <span>auto-graph: sin cos tan y=</span>
      </div>
    </div>
  )
}
