import React from "react"

interface VariablesProps {
  variables: Record<string, number>
  onClearVariables: () => void
}

export function Variables({ variables, onClearVariables }: VariablesProps) {
  const hasVariables = Object.keys(variables).length > 0

  if (!hasVariables) {
    return null
  }

  return (
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
  )
}
