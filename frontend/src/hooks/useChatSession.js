import { useState, useEffect } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'

export function useChatSession(machineId) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize Session
  useEffect(() => {
    if (!machineId) return

    async function initSession() {
      try {
        const res = await fetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: machineId })
        })
        const data = await res.json()
        setSessionId(data.session_id)
      } catch (err) {
        console.error("Failed to init chat session", err)
      }
    }
    initSession()
  }, [machineId])

  // Initial greeting
  useEffect(() => {
    if (!sessionId || messages.length > 0) return
    setMessages([{
      role: 'assistant',
      content: "I am your DriftVeil AI Simulation Assistant. How can I help you mitigate this issue?"
    }])
  }, [sessionId, messages])

  const sendMessage = async (text) => {
    if (!sessionId || !text) return

    const newMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, newMsg])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, message: text })
      })

      const data = await res.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.assistant_message,
        simulation: data.simulation
      }])
    } catch (err) {
      console.error("Chat failure", err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error reaching simulation context layer."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, sendMessage, isLoading }
}
