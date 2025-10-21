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
  variables: Record<string, number>
  setVariables: (variables: Record<string, number>) => void
}

export function EntrySpace({
  input,
  setInput,
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
  variables,
  setVariables,
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

  const isVariableAssignment = (expr: string): { isAssignment: boolean; varName?: string; value?: number; error?: boolean } => {
    // Match pattern: [letter] = [something]
    // But exclude x and y
    const match = expr.trim().match(/^([a-wz])[\s]*=[\s]*(.*)$/i)
    if (match) {
      const varName = match[1].toLowerCase()
      const valueExpr = match[2].trim()
      
      // Check if value expression is empty
      if (!valueExpr) {
        return { isAssignment: true, error: true, varName }
      }
      
      try {
        // Process the value expression (could include other variables)
        const processedExpr = replaceVariablesAndAnswers(valueExpr)
        const value = evaluate(processedExpr)
        
        if (typeof value === 'number' && isFinite(value)) {
          return { isAssignment: true, varName, value }
        } else {
          // Non-numeric result
          return { isAssignment: true, error: true, varName }
        }
      } catch (e) {
        // Invalid expression
        return { isAssignment: true, error: true, varName }
      }
    }
    return { isAssignment: false }
  }

  const isGraphEquation = (expr: string): boolean => {
    const lower = expr.toLowerCase().trim()
    
    // Check for explicit y= equations first
    if (lower.includes("y=") || lower.includes("y =")) {
      return true
    }
    
    // Check for standalone x or y variables (like "x" or "y^2")
    if (lower.match(/\b[xy]\b/) !== null) {
      return true
    }
    
    // For trig functions, only treat as graph if they contain x or y
    if (lower.includes("sin") || lower.includes("cos") || lower.includes("tan")) {
      // If it contains x or y, it's a graph equation
      if (lower.includes("x") || lower.includes("y")) {
        return true
      }
      // If it's just sin(number), cos(number), tan(number), treat as numeric
      return false
    }
    
    return false
  }

  const isTrigFunction = (expr: string): boolean => {
    const lower = expr.toLowerCase().trim()
    return (
      lower.includes("sin") ||
      lower.includes("cos") ||
      lower.includes("tan")
    ) && !lower.includes("x") && !lower.includes("y")
  }

  const replaceVariablesAndAnswers = (expr: string): string => {
    let result = expr

    // Replace ln() with log() for natural logarithm
    result = result.replace(/\bln\s*\(/g, 'log(')

    // Replace custom variables
    for (const [varName, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\b${varName}\\b`, "g")
      result = result.replace(pattern, String(value))
    }

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

  // Keep old function name for backward compatibility
  const replaceAnswerReferences = replaceVariablesAndAnswers

  // Calculate preview result
  const getPreview = (): { value: string; type: "normal" | "error" | "graph" | "variable" | "trig" } => {
    if (!input.trim()) return { value: "", type: "normal" }
    
    // Check if it's a variable assignment
    const varAssignment = isVariableAssignment(input)
    if (varAssignment.isAssignment) {
      if (varAssignment.error) {
        return { value: "ERR", type: "error" }
      }
      if (varAssignment.value !== undefined) {
        return { value: String(varAssignment.value), type: "variable" }
      }
    }
    
    // Check if it's a trig function (numeric)
    if (isTrigFunction(input)) {
      try {
        const processedInput = replaceAnswerReferences(input)
        const result = evaluate(processedInput)
        if (typeof result === 'number' && isFinite(result)) {
          return { value: String(result), type: "trig" }
        }
      } catch {
        return { value: "ERR", type: "error" }
      }
    }
    
    // Check if it's a graph equation
    if (isGraphEquation(input)) {
      return { value: "GRAPH", type: "graph" }
    }
    
    try {
      const processedInput = replaceAnswerReferences(input)
      const result = evaluate(processedInput)
      
      // Check if result is numeric
      if (typeof result === 'number' && isFinite(result)) {
        return { value: String(result), type: "normal" }
      }
      
      // Non-numeric result (undefined variable, function, object, etc.)
      return { value: "ERR", type: "error" }
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
        // Check if it's a variable assignment
        const varAssignment = isVariableAssignment(input)
        if (varAssignment.isAssignment) {
          // Check if there's an error in the assignment
          if (varAssignment.error) {
            // Add error to history
            const maxId = history.length > 0 ? Math.max(...history.map(h => h.id)) : 0
            const entry: HistoryEntry = {
              id: maxId + 1,
              expression: input,
              result: "ERR",
              timestamp: Date.now(),
            }
            setHistory([entry, ...history].slice(0, 100))
            setInput("")
            setHistoryIndex(-1)
            return
          }
          
          // Valid assignment
          if (varAssignment.varName && varAssignment.value !== undefined) {
            // Store the variable
            setVariables({
              ...variables,
              [varAssignment.varName]: varAssignment.value
            })
            
            // Add to history
            const maxId = history.length > 0 ? Math.max(...history.map(h => h.id)) : 0
            const entry: HistoryEntry = {
              id: maxId + 1,
              expression: input,
              result: String(varAssignment.value),
              timestamp: Date.now(),
            }
            setHistory([entry, ...history].slice(0, 100))
            setInput("")
            setHistoryIndex(-1)
            return
          }
        }

        let resultValue: string
        let intermediateExpr: string = ""
        
        // Check if it's a trig function (numeric)
        if (isTrigFunction(input)) {
          try {
            const processedInput = replaceAnswerReferences(input)
            const result = evaluate(processedInput)
            if (typeof result === 'number' && isFinite(result)) {
              resultValue = String(result)
            } else {
              resultValue = "ERR"
            }
          } catch (error) {
            resultValue = "ERR"
          }
        }
        // Check if it's a graph equation
        else if (isGraphEquation(input)) {
          resultValue = "GRAPH"
        } else {
          try {
            const processedInput = replaceAnswerReferences(input)
            const result = evaluate(processedInput)
            
            // Check if result is numeric
            if (typeof result === 'number' && isFinite(result)) {
              resultValue = String(result)
              // Get intermediate expression for parentheses expressions
              intermediateExpr = getIntermediateExpression(input)
            } else {
              // Non-numeric result (undefined variable, function, object, etc.)
              resultValue = "ERR"
            }
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
                preview.type === "variable" ? "text-green-500" :
                preview.type === "trig" ? "text-orange-500" :
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
        <span>variables: a=3 b=4</span>
        <span className="text-[#444]">|</span>
        <span>autograph: sin cos tan y= </span>
      </div>
    </div>
  )
}
